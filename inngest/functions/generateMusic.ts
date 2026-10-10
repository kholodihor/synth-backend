import axios from "axios";
import { inngest } from "../client";
import { RedisService } from "../../utils/redis";

const ENDPOINTS = {
  withDescribedLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_DESCRIBED_LYRICS,
  fromDescription: process.env.MODAL_ENDPOINT_GENERATE_FROM_DESCRIPTION,
  withLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_LYRICS,
  generate: process.env.MODAL_ENDPOINT_GENERATE,
} as const;

const JOB_TTL = 60 * 60; // 1 hour

export type GenerateMusicEvent = {
  name: "app/generate.music";
  data: {
    jobId: string;
    kind: keyof typeof ENDPOINTS;
    payload: Record<string, unknown>;
    userId?: string;
  };
};

const buildModalPayload = (kind: GenerateMusicEvent["data"]["kind"], payload: Record<string, any>) => {
  const base = {
    audio_duration: payload.audio_duration || 180.0,
    seed: payload.seed || -1,
    guidance_scale: payload.guidance_scale || 15.0,
    infer_step: payload.infer_step || 60,
    instrumental: payload.instrumental || false,
  };

  switch (kind) {
    case "fromDescription":
      return { ...base, full_described_song: payload.description || payload.full_described_song || "" };
    case "withLyrics":
      return { ...base, prompt: payload.prompt || "", lyrics: payload.lyrics || "" };
    case "withDescribedLyrics":
      return {
        ...base,
        prompt: payload.prompt || "",
        described_lyrics: payload.described_lyrics || payload.description || "",
      };
    case "generate":
      return {};
    default:
      return payload;
  }
};

export const generateMusic = inngest.createFunction(
  {
    id: "generate-music",
    concurrency: { limit: 10 },
  },
  { event: "app/generate.music" },
  async ({ event, step }) => {
    const { jobId, kind, payload } = event.data as GenerateMusicEvent["data"];
    const key = `job:${jobId}`;

    await step.run("set-processing-status", async () => {
      await RedisService.setWithTTL(key, { status: "processing" }, JOB_TTL);
      console.log("[inngest] generateMusic queued", { jobId, kind });
      return { queued: true };
    });

    const endpoint = ENDPOINTS[kind];
    if (!endpoint) {
      await step.run("set-error-status", async () => {
        await RedisService.setWithTTL(
          key,
          { status: "error", error: "Modal endpoint not configured" },
          JOB_TTL
        );
      });
      return { ok: false, jobId, error: "Modal endpoint not configured" };
    }

    const modalPayload = buildModalPayload(kind, payload);

    // Schedule the Modal API call as a fire-and-forget background task;
    // the job result is written to Redis for the status endpoint to read.
    await step.run("schedule-modal-processing", async () => {
      console.log("[inngest] Scheduling Modal API call", { jobId, endpoint, kind });

      setTimeout(async () => {
        try {
          const res = await axios.post(endpoint, modalPayload, {
            timeout: 15 * 60 * 1000,
            headers: { "Content-Type": "application/json" },
          });
          await RedisService.setWithTTL(key, { status: "done", result: res.data }, JOB_TTL);
          console.log("[inngest] Modal API completed successfully", { jobId });
        } catch (error: any) {
          await RedisService.setWithTTL(
            key,
            { status: "error", error: error?.message ?? "unknown" },
            JOB_TTL
          );
          console.error("[inngest] Modal API failed", { jobId, error: error.message });
        }
      }, 100);

      return { scheduled: true };
    });

    return { ok: true, jobId, status: "processing" };
  }
);
