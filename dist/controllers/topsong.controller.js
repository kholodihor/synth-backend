"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopSongs = exports.addTopSong = void 0;
const topsong_model_1 = __importDefault(require("../models/topsong.model"));
const addTopSong = async (req, res, next) => {
    const { title, artist, song } = req.body;
    try {
        const newSong = new topsong_model_1.default({
            title,
            artist,
            song,
        });
        await newSong.save();
        res.status(200).json(newSong);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Can`t add song",
        });
    }
};
exports.addTopSong = addTopSong;
const getTopSongs = async (req, res, next) => {
    try {
        const songs = await topsong_model_1.default.find();
        return res.json(songs);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Can`t get Topsongs",
        });
    }
};
exports.getTopSongs = getTopSongs;
