import { Router } from "express";
import {
  generateWithDescribedLyrics,
  generateFromDescription,
  generateWithLyrics,
  generateTest,
} from "../controllers/music.controller";

const router = Router();

// Proxy endpoints to Modal app (mounted at /api/music)
router.post("/generate-with-described-lyrics", generateWithDescribedLyrics);
router.post("/generate-from-description", generateFromDescription);
router.post("/generate-with-lyrics", generateWithLyrics);
router.post("/generate-test", generateTest);

export default router;
