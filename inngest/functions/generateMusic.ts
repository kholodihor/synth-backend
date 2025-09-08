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

    // Immediately set processing status and return quickly
    await step.run("set-processing-status", async () => {
      await redis.set(key, JSON.stringify({ status: "processing" }), "EX", 60 * 60);
      console.log("[inngest] generateMusic queued", { jobId, kind });
      return { queued: true };
    });

    const endpoint = (ENDPOINTS as any)[kind];
    if (!endpoint) {
      await step.run("set-error-status", async () => {
        await redis.set(key, JSON.stringify({ status: "error", error: "Modal endpoint not configured" }), "EX", 60 * 60);
      });
      return { ok: false, jobId, error: "Modal endpoint not configured" };
    }

    // Transform payload to match Modal API expectations
    let modalPayload = {};
    
    switch (kind) {
      case "fromDescription":
        modalPayload = {
          full_described_song: payload.description || payload.full_described_song || "",
          audio_duration: payload.audio_duration || 180.0,
          seed: payload.seed || -1,
          guidance_scale: payload.guidance_scale || 15.0,
          infer_step: payload.infer_step || 60,
          instrumental: payload.instrumental || false
        };
        break;
        
      case "withLyrics":
        modalPayload = {
          prompt: payload.prompt || "",
          lyrics: payload.lyrics || "",
          audio_duration: payload.audio_duration || 180.0,
          seed: payload.seed || -1,
          guidance_scale: payload.guidance_scale || 15.0,
          infer_step: payload.infer_step || 60,
          instrumental: payload.instrumental || false
        };
        break;
        
      case "withDescribedLyrics":
        modalPayload = {
          prompt: payload.prompt || "",
          described_lyrics: payload.described_lyrics || payload.description || "",
          audio_duration: payload.audio_duration || 180.0,
          seed: payload.seed || -1,
          guidance_scale: payload.guidance_scale || 15.0,
          infer_step: payload.infer_step || 60,
          instrumental: payload.instrumental || false
        };
        break;
        
      case "generate":
        modalPayload = {}; // No payload needed for basic generate
        break;
        
      default:
        modalPayload = payload;
    }

    // Schedule the Modal API call as a separate background step that can take time
    await step.run("schedule-modal-processing", async () => {
      // This step just initiates the background processing
      console.log("[inngest] Scheduling Modal API call", { jobId, endpoint, kind });
      
      // Fire and forget - don't wait for the response
      setTimeout(async () => {
        try {
          console.log("[inngest] Calling Modal API", { jobId, endpoint, kind, modalPayload });
          const res = await axios.post(endpoint, modalPayload, { 
            timeout: 15 * 60 * 1000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          await redis.set(key, JSON.stringify({ status: "done", result: res.data }), "EX", 60 * 60);
          console.log("[inngest] Modal API completed successfully", { jobId });
        } catch (error: any) {
          await redis.set(
            key,
            JSON.stringify({ status: "error", error: error?.message ?? "unknown" }),
            "EX",
            60 * 60
          );
          console.error("[inngest] Modal API failed", { jobId, error: error.message });
        }
      }, 100); // Start processing after 100ms
      
      return { scheduled: true };
    });

    // Return immediately with processing status
    return { ok: true, jobId, status: "processing" };
  }
);
