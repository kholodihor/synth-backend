"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBand = exports.editBand = exports.getBandsByUser = exports.getOneBand = exports.getAllBands = exports.createBand = void 0;
const band_model_1 = __importDefault(require("../models/band.model"));
const redis_1 = require("../utils/redis");
const createBand = async (req, res) => {
    const { title, description, location, image } = req.body;
    try {
        const band = new band_model_1.default({
            title,
            description,
            location,
            image,
            user: req.userId,
        });
        await band.save();
        // Invalidate caches
        await Promise.all([
            redis_1.RedisService.delete(`user:${req.userId}:bands`),
            redis_1.RedisService.delete("bands:all")
        ]);
        res.status(200).json(band);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Unable to create Band",
        });
    }
};
exports.createBand = createBand;
const getAllBands = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const query = req.query.query || "";
        // If no pagination is requested, return all bands
        if (!req.query.page) {
            const cacheKey = "bands:all";
            const cachedBands = await redis_1.RedisService.get(cacheKey);
            if (cachedBands) {
                return res.json(JSON.parse(cachedBands));
            }
            const bands = await band_model_1.default.find()
                .sort({ createdAt: "desc" })
                .populate("user");
            // Cache for 5 minutes
            await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(bands), 300);
            return res.json(bands);
        }
        // Handle paginated request
        const cacheKey = `bands:page:${String(page)}:limit:${limit}:query:${query}`;
        const cachedResult = await redis_1.RedisService.get(cacheKey);
        if (cachedResult) {
            return res.json(JSON.parse(cachedResult));
        }
        const skip = (page - 1) * limit;
        const regex = new RegExp(query, "i");
        const [bands, totalCount] = await Promise.all([
            band_model_1.default.find({ title: { $regex: regex } })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: "desc" })
                .populate("user"),
            band_model_1.default.countDocuments({ title: { $regex: regex } }),
        ]);
        const result = {
            bands,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            limit,
        };
        // Cache for 5 minutes
        await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(result), 300);
        res.json(result);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to get bands",
        });
    }
};
exports.getAllBands = getAllBands;
const getOneBand = async (req, res) => {
    try {
        const cacheKey = `band:${req.params.id}`;
        const cachedBand = await redis_1.RedisService.get(cacheKey);
        if (cachedBand) {
            return res.json(JSON.parse(cachedBand));
        }
        const band = await band_model_1.default.findById(req.params.id).populate("user");
        if (!band) {
            return res.status(404).json({
                message: "Band not found",
            });
        }
        // Cache for 10 minutes
        await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(band), 600);
        res.json(band);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to get band",
        });
    }
};
exports.getOneBand = getOneBand;
const getBandsByUser = async (req, res) => {
    try {
        const cacheKey = `user:${req.userId}:bands`;
        const cachedBands = await redis_1.RedisService.get(cacheKey);
        if (cachedBands) {
            return res.json(JSON.parse(cachedBands));
        }
        const bands = await band_model_1.default.find({ user: req.userId })
            .sort({ createdAt: "desc" })
            .populate("user");
        // Cache for 5 minutes
        await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(bands), 300);
        res.json(bands);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to get bands",
        });
    }
};
exports.getBandsByUser = getBandsByUser;
const editBand = async (req, res) => {
    try {
        const bandId = req.params.id;
        const { title, description, location, image } = req.body;
        const band = await band_model_1.default.findByIdAndUpdate(bandId, {
            title,
            description,
            location,
            image,
        }, { new: true });
        if (!band) {
            return res.status(404).json({
                message: "Band not found",
            });
        }
        // Invalidate caches
        await Promise.all([
            redis_1.RedisService.delete(`band:${req.params.id}`),
            redis_1.RedisService.delete(`user:${req.userId}:bands`),
            redis_1.RedisService.delete("bands:all")
        ]);
        res.status(200).json({ message: `Band ${title} Updated` });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to edit Band",
        });
    }
};
exports.editBand = editBand;
const deleteBand = async (req, res) => {
    try {
        const bandId = req.params.id;
        const band = await band_model_1.default.findByIdAndDelete(bandId);
        if (!band) {
            return res.status(404).json({
                message: "Band not found",
            });
        }
        // Invalidate caches
        await Promise.all([
            redis_1.RedisService.delete(`band:${req.params.id}`),
            redis_1.RedisService.delete(`user:${req.userId}:bands`),
            redis_1.RedisService.delete("bands:all")
        ]);
        res.status(200).json("Band deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to delete Band",
        });
    }
};
exports.deleteBand = deleteBand;
