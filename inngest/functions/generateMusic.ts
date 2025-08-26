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
  { id: "generate-music" },
  { event: "app/generate.music" },
  async ({ event, step }: any) => {
    const { jobId, kind, payload } = (event as any).data as GenerateMusicEvent["data"];

    const redis = RedisService.getInstance();
    const key = `job:${jobId}`;

    try {
      await redis.set(key, JSON.stringify({ status: "processing" }), "EX", 60 * 60);

      const endpoint = (ENDPOINTS as any)[kind];
      if (!endpoint) {
        throw new Error(`Modal endpoint not configured for kind=${kind}`);
      }

      await step.run("log:start", async () => {
        console.log("[inngest] generateMusic starting on inngest", { jobId, kind });
      });

      const data = await step.run("call-modal", async () => {
        const res = await axios.post(endpoint, payload, { timeout: 15 * 60 * 1000 });
        return res.data;
      });

      await redis.set(key, JSON.stringify({ status: "done", result: data }), "EX", 60 * 60);
      await step.run("log:done", async () => {
        console.log("[inngest] generateMusic done", { jobId });
      });
      return { ok: true };
    } catch (error: any) {
      await redis.set(
        key,
        JSON.stringify({ status: "error", error: error?.message ?? "unknown" }),
        "EX",
        60 * 60
      );
      await step.run("log:error", async () => {
        console.error("[inngest] generateMusic error", { jobId, message: error?.message });
      });
      throw error;
    }
  }
);
