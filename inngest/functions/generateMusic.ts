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
      // Set initial processing status
      await step.run("set-processing-status", async () => {
        await redis.set(key, JSON.stringify({ status: "processing" }), "EX", 60 * 60);
        console.log("[inngest] generateMusic starting on inngest", { jobId, kind });
      });

      const endpoint = (ENDPOINTS as any)[kind];
      if (!endpoint) {
        throw new Error(`Modal endpoint not configured for kind=${kind}`);
      }

      // Make the Modal API call with proper timeout handling
      const data = await step.run("call-modal", async () => {
        try {
          const res = await axios.post(endpoint, payload, { 
            timeout: 15 * 60 * 1000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          return res.data;
        } catch (error: any) {
          console.error("[inngest] Modal API error", { jobId, error: error.message });
          throw error;
        }
      });

      // Store successful result
      await step.run("store-result", async () => {
        await redis.set(key, JSON.stringify({ status: "done", result: data }), "EX", 60 * 60);
        console.log("[inngest] generateMusic completed successfully", { jobId });
      });

      return { ok: true, jobId, result: data };
    } catch (error: any) {
      // Store error result
      await step.run("store-error", async () => {
        await redis.set(
          key,
          JSON.stringify({ status: "error", error: error?.message ?? "unknown" }),
          "EX",
          60 * 60
        );
        console.error("[inngest] generateMusic failed", { jobId, message: error?.message });
      });
      
      // Don't re-throw the error to avoid function failure
      return { ok: false, jobId, error: error?.message ?? "unknown" };
    }
  }
);
