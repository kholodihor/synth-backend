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
exports.deleteBand = exports.editBand = exports.getBandsByUser = exports.getOneBand = exports.getAllBandsPaginate = exports.getAllBands = exports.createBand = void 0;
const band_model_1 = __importDefault(require("../models/band.model"));
const createBand = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, location, image } = req.body;
    try {
        const band = new band_model_1.default({
            title,
            description,
            location,
            image,
            user: req.userId,
        });
        const newBand = yield band.save();
        res.status(200).json(newBand);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Unable to create Band",
        });
    }
});
exports.createBand = createBand;
const getAllBands = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bands = yield band_model_1.default.find()
            .sort({ createdAt: "desc" })
            .populate("user")
            .exec();
        res.status(200).json(bands);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Can`t get bands",
        });
    }
});
exports.getAllBands = getAllBands;
const getAllBandsPaginate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = req.query.page || 1;
    const bandsPerPage = 6;
    let skip;
    if (page == 1) {
        skip = 0;
    }
    else {
        skip = page * bandsPerPage - bandsPerPage;
    }
    try {
        const bands = yield band_model_1.default.find()
            .sort({ createdAt: "desc" })
            .skip(skip)
            .limit(bandsPerPage)
            .populate("user")
            .exec();
        res.status(200).json(bands);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Can`t get bands",
        });
    }
});
exports.getAllBandsPaginate = getAllBandsPaginate;
const getOneBand = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bandId = req.params.id;
    try {
        const band = yield band_model_1.default.findById({ _id: bandId });
        res.json(band);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Can`t get Band",
        });
    }
});
exports.getOneBand = getOneBand;
const getBandsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bands = yield band_model_1.default.find({ user: req.userId }).sort({
            createdAt: "desc",
        });
        res.json(bands);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Can`t get Band",
        });
    }
});
exports.getBandsByUser = getBandsByUser;
const editBand = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bandId = req.params.id;
        const { title, description, location, image } = req.body;
        yield band_model_1.default.updateOne({ _id: bandId }, {
            title,
            description,
            location,
            image,
            user: req.userId,
        });
        res.status(200).json({ message: `Band ${title} Updated` });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to edit Band",
        });
    }
});
exports.editBand = editBand;
const deleteBand = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bandId = req.params.id;
        yield band_model_1.default.findOneAndDelete({ _id: bandId });
        res.status(200).json("Band deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to delete Band",
        });
    }
});
exports.deleteBand = deleteBand;
