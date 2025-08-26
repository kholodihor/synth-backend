import axios from "axios";
import { inngest } from "../client";
import { RedisService } from "../../utils/redis";

const ENDPOINTS = {
  withDescribedLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_DESCRIBED_LYRICS,
  fromDescription: process.env.MODAL_ENDPOINT_GENERATE_FROM_DESCRIPTION,
  withLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_LYRICS,
  generate: process.env.MODAL_ENDPOINT_GENERATE,
};

export type GenerateMusicEvent = {
  name: "app/generate.music";
  data: {
    jobId: string;
    kind: "withDescribedLyrics" | "fromDescription" | "withLyrics" | "generate";
    payload: any;
    userId?: string;
  };
};

export const generateMusic = inngest.createFunction(
  { 
    id: "generate-music",
    concurrency: { limit: 10 }
  },
  { event: "app/generate.music" },
  async ({ event, step }: any) => {
    const { jobId, kind, payload } = (event as any).data as GenerateMusicEvent["data"];

    const redis = RedisService.getInstance();
    const key = `job:${jobId}`;

    // Immediately set processing status and return - don't wait for Modal
    await step.run("set-processing-status", async () => {
      await redis.set(key, JSON.stringify({ status: "processing" }), "EX", 60 * 60);
      console.log("[inngest] generateMusic queued", { jobId, kind });
    });

    const endpoint = (ENDPOINTS as any)[kind];
    if (!endpoint) {
      await redis.set(key, JSON.stringify({ status: "error", error: "Modal endpoint not configured" }), "EX", 60 * 60);
      return { ok: false, jobId, error: "Modal endpoint not configured" };
    }

    // Schedule the actual processing as a separate background step
    await step.run("schedule-processing", async () => {
      // This runs in the background without blocking the webhook response
      try {
        const res = await axios.post(endpoint, payload, { 
          timeout: 15 * 60 * 1000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        await redis.set(key, JSON.stringify({ status: "done", result: res.data }), "EX", 60 * 60);
        console.log("[inngest] generateMusic completed", { jobId });
        return res.data;
      } catch (error: any) {
        await redis.set(
          key,
          JSON.stringify({ status: "error", error: error?.message ?? "unknown" }),
          "EX",
          60 * 60
        );
        console.error("[inngest] generateMusic failed", { jobId, error: error.message });
        throw error;
      }
    });

    return { ok: true, jobId, status: "processing" };
  }
);
