import { Request, Response } from "express";
import { inngest } from "../inngest/client";
import { RedisService } from "../utils/redis";
import { randomUUID } from "crypto";

const JOB_KINDS = ["withDescribedLyrics", "fromDescription", "withLyrics", "generate"] as const;
type JobKind = (typeof JOB_KINDS)[number];
const JOB_TTL = 60 * 60; // 1 hour

interface JobStatus {
  status: "pending" | "processing" | "done" | "error";
  result?: unknown;
  error?: string;
}

export const enqueueGenerate = async (req: Request, res: Response) => {
  try {
    const { kind, payload } = req.body as { kind: JobKind; payload?: unknown };

    if (!JOB_KINDS.includes(kind)) {
      return res.status(400).json({ error: `Missing or invalid kind. Expected one of: ${JOB_KINDS.join(", ")}` });
    }

    const jobId = randomUUID();

    await inngest.send({
      name: "app/generate.music",
      data: {
        jobId,
        kind,
        payload: payload ?? {},
        userId: req.userId,
      },
    });

    const status: JobStatus = { status: "pending" };
    await RedisService.setWithTTL(`job:${jobId}`, status, JOB_TTL);

    return res.status(202).json({ jobId });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to enqueue" });
  }
};

export const getJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId" });
    }

    const job = await RedisService.get<JobStatus>(`job:${jobId}`);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json(job);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to read status" });
  }
};
