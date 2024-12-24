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
exports.deleteSong = exports.getSongsByUser = exports.addSong = void 0;
const song_model_1 = __importDefault(require("../models/song.model"));
const addSong = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, artist, song } = req.body;
    try {
        const newSong = new song_model_1.default({
            title,
            artist,
            song,
            user: req.userId,
        });
        yield newSong.save();
        res.status(200).json(newSong);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to add song",
        });
    }
});
exports.addSong = addSong;
const getSongsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const songs = yield song_model_1.default.find({ user: req.userId });
        return res.json(songs);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Can`t get Song",
        });
    }
});
exports.getSongsByUser = getSongsByUser;
const deleteSong = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const songId = req.params.id;
        yield song_model_1.default.findOneAndDelete({ _id: songId });
        res.status(200).json("Song deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Can`t delete song",
        });
    }
});
exports.deleteSong = deleteSong;
