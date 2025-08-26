"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const job_controller_1 = require("../controllers/job.controller");
const router = (0, express_1.Router)();
// Enqueue a music generation job
router.post("/enqueue", job_controller_1.enqueueGenerate);
// Read job status/result
router.get("/:jobId", job_controller_1.getJobStatus);
exports.default = router;
