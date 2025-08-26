import { Request, Response } from "express";
import { inngest } from "../inngest/client";
import { RedisService } from "../utils/redis";
import { randomUUID } from "crypto";

export const enqueueGenerate = async (req: Request, res: Response) => {
  try {
    const { kind, payload } = req.body as {
      kind: "withDescribedLyrics" | "fromDescription" | "withLyrics" | "generate";
      payload: any;
    };

    if (!kind) {
      return res.status(400).json({ error: "Missing kind" });
    }

    const jobId = randomUUID();

    await inngest.send({
      name: "app/generate.music",
      data: {
        jobId,
        kind,
        payload: payload ?? {},
        // @ts-ignore optional user id if middleware injected
        userId: (req as any).userId,
      },
    });

    // Initialize job status in Redis to pending
    const redis = RedisService.getInstance();
    await redis.set(
      `job:${jobId}`,
      JSON.stringify({ status: "pending" }),
      "EX",
      60 * 60
    );

    return res.status(202).json({ jobId });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to enqueue" });
  }
};

export const getJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params as { jobId: string };
    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId" });
    }

    const redis = RedisService.getInstance();
    const raw = await redis.get(`job:${jobId}`);
    if (!raw) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json(JSON.parse(raw));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to read status" });
  }
};
