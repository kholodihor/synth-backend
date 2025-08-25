"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const music_controller_1 = require("../controllers/music.controller");
const router = (0, express_1.Router)();
// Proxy endpoints to Modal app (mounted at /api/music)
router.post("/generate-with-described-lyrics", music_controller_1.generateWithDescribedLyrics);
router.post("/generate-from-description", music_controller_1.generateFromDescription);
router.post("/generate-with-lyrics", music_controller_1.generateWithLyrics);
router.post("/generate-test", music_controller_1.generateTest);
exports.default = router;
