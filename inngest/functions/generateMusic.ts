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

    // Immediately set processing status
    await step.run("set-processing-status", async () => {
      await redis.set(key, JSON.stringify({ status: "processing" }), "EX", 60 * 60);
      console.log("[inngest] generateMusic started", { jobId, kind });
    });

    const endpoint = (ENDPOINTS as any)[kind];
    if (!endpoint) {
      await step.run("set-error-status", async () => {
        await redis.set(key, JSON.stringify({ status: "error", error: "Modal endpoint not configured" }), "EX", 60 * 60);
      });
      return { ok: false, jobId, error: "Modal endpoint not configured" };
    }

    // Process the Modal API call with proper error handling
    const result = await step.run("call-modal-api", async () => {
      try {
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
        
        console.log("[inngest] Calling Modal API", { jobId, endpoint, kind, modalPayload });
        const res = await axios.post(endpoint, modalPayload, { 
          timeout: 15 * 60 * 1000, // 15 minutes - this is fine within Inngest
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log("[inngest] Modal API success", { jobId });
        return { success: true, data: res.data };
      } catch (error: any) {
        console.error("[inngest] Modal API failed", { jobId, error: error.message, response: error.response?.data });
        return { success: false, error: error?.message ?? "unknown", details: error.response?.data };
      }
    });

    // Update final status based on result
    await step.run("set-final-status", async () => {
      if (result.success) {
        await redis.set(key, JSON.stringify({ status: "done", result: result.data }), "EX", 60 * 60);
        console.log("[inngest] generateMusic completed", { jobId });
      } else {
        await redis.set(
          key,
          JSON.stringify({ status: "error", error: result.error }),
          "EX",
          60 * 60
        );
        console.error("[inngest] generateMusic failed", { jobId, error: result.error });
      }
    });

    return { 
      ok: result.success, 
      jobId, 
      status: result.success ? "done" : "error",
      ...(result.success ? { result: result.data } : { error: result.error })
    };
  }
);
