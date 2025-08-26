import { Router } from "express";
import { enqueueGenerate, getJobStatus } from "../controllers/job.controller";

const router = Router();

// Enqueue a music generation job
router.post("/enqueue", enqueueGenerate);

// Read job status/result
router.get("/:jobId", getJobStatus);

export default router;
