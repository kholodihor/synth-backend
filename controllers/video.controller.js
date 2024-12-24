"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideo = exports.getAllVideos = exports.getVideosByUser = exports.addVideo = void 0;
const video_model_1 = __importDefault(require("../models/video.model"));
const addVideo = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, url } = req.body;
    try {
        const newVideo = new video_model_1.default({
            title,
            url,
            user: req.userId,
        });
        yield newVideo.save();
        res.status(200).json(newVideo);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to add a video",
        });
    }
});
exports.addVideo = addVideo;
const getVideosByUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const videos = yield video_model_1.default.find({ user: req.userId });
        res.json(videos);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to get videos by user",
        });
    }
});
exports.getVideosByUser = getVideosByUser;
const getAllVideos = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const videos = yield video_model_1.default.find().sort({ createdAt: "desc" });
        return res.json(videos);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to get videos",
        });
    }
});
exports.getAllVideos = getAllVideos;
const deleteVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const videoId = req.params.id;
        yield video_model_1.default.findOneAndDelete({ _id: videoId });
        res.status(200).json("Video deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to delete videos",
        });
    }
});
exports.deleteVideo = deleteVideo;
