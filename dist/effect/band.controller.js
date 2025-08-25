"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBand = exports.editBand = exports.getBandsByUser = exports.getOneBand = exports.getAllBands = exports.createBand = void 0;
const effect_1 = require("effect");
const band_model_1 = __importDefault(require("../models/band.model"));
const redis_1 = require("../utils/redis");
/**
 * Effect-based controller for band operations
 * This controller uses Effect for error handling and functional composition
 * while maintaining compatibility with the existing model
 */
/**
 * Create a new band
 */
const createBand = async (req, res) => {
    const { title, description, location, image } = req.body;
    const program = (0, effect_1.pipe)(effect_1.Effect.tryPromise({
        try: async () => {
            const band = new band_model_1.default({
                title,
                description,
                location,
                image,
                user: req.userId,
            });
            return await band.save();
        },
        catch: (error) => new Error(`Failed to create band: ${error}`)
    }), effect_1.Effect.flatMap((band) => effect_1.Effect.tryPromise({
        try: async () => {
            // Invalidate caches
            await Promise.all([
                redis_1.RedisService.delete(`user:${req.userId}:bands`),
                redis_1.RedisService.delete("bands:all")
            ]);
            return band;
        },
        catch: (error) => new Error(`Failed to invalidate cache: ${error}`)
    })), effect_1.Effect.match({
        onSuccess: (band) => {
            res.status(200).json(band);
        },
        onFailure: (error) => {
            console.log(error);
            res.status(500).json({
                message: error instanceof Error ? error.message : "Unable to create Band"
            });
        }
    }));
    // Run the Effect program
    await effect_1.Effect.runPromise(program);
};
exports.createBand = createBand;
/**
 * Get all bands with optional pagination
 */
const getAllBands = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const query = req.query.query || "";
    // If no pagination is requested, return all bands
    if (!req.query.page) {
        const getAllBandsProgram = (0, effect_1.pipe)(effect_1.Effect.tryPromise({
            try: async () => {
                const cacheKey = "bands:all";
                const cachedBands = await redis_1.RedisService.get(cacheKey);
                if (cachedBands) {
                    return JSON.parse(cachedBands);
                }
                const bands = await band_model_1.default.find()
                    .sort({ createdAt: "desc" })
                    .populate("user");
                // Cache for 5 minutes
                await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(bands), 300);
                return bands;
            },
            catch: (error) => new Error(`Failed to get all bands: ${error}`)
        }), effect_1.Effect.match({
            onSuccess: (bands) => {
                res.json(bands);
            },
            onFailure: (error) => {
                console.log(error);
                res.status(500).json({
                    message: error instanceof Error ? error.message : "Failed to get bands"
                });
            }
        }));
        await effect_1.Effect.runPromise(getAllBandsProgram);
        return;
    }
    // Handle paginated request
    const getPaginatedBandsProgram = (0, effect_1.pipe)(effect_1.Effect.tryPromise({
        try: async () => {
            const cacheKey = `bands:page:${String(page)}:limit:${limit}:query:${query}`;
            const cachedResult = await redis_1.RedisService.get(cacheKey);
            if (cachedResult) {
                return JSON.parse(cachedResult);
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
            return result;
        },
        catch: (error) => new Error(`Failed to get paginated bands: ${error}`)
    }), effect_1.Effect.match({
        onSuccess: (result) => {
            res.json(result);
        },
        onFailure: (error) => {
            console.log(error);
            res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to get bands"
            });
        }
    }));
    await effect_1.Effect.runPromise(getPaginatedBandsProgram);
};
exports.getAllBands = getAllBands;
/**
 * Get a single band by ID
 */
const getOneBand = async (req, res) => {
    const getBandProgram = (0, effect_1.pipe)(effect_1.Effect.tryPromise({
        try: async () => {
            const cacheKey = `band:${req.params.id}`;
            const cachedBand = await redis_1.RedisService.get(cacheKey);
            if (cachedBand) {
                return JSON.parse(cachedBand);
            }
            const band = await band_model_1.default.findById(req.params.id).populate("user");
            if (!band) {
                throw new Error("Band not found");
            }
            // Cache for 10 minutes
            await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(band), 600);
            return band;
        },
        catch: (error) => error instanceof Error ? error : new Error(`Failed to get band: ${error}`)
    }), effect_1.Effect.match({
        onSuccess: (band) => {
            res.json(band);
        },
        onFailure: (error) => {
            console.log(error);
            if (error.message === "Band not found") {
                res.status(404).json({ message: error.message });
            }
            else {
                res.status(500).json({
                    message: "Failed to get band"
                });
            }
        }
    }));
    await effect_1.Effect.runPromise(getBandProgram);
};
exports.getOneBand = getOneBand;
/**
 * Get bands by user ID
 */
const getBandsByUser = async (req, res) => {
    const getUserBandsProgram = (0, effect_1.pipe)(effect_1.Effect.tryPromise({
        try: async () => {
            const cacheKey = `user:${req.userId}:bands`;
            const cachedBands = await redis_1.RedisService.get(cacheKey);
            if (cachedBands) {
                return JSON.parse(cachedBands);
            }
            const bands = await band_model_1.default.find({ user: req.userId })
                .sort({ createdAt: "desc" })
                .populate("user");
            // Cache for 5 minutes
            await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(bands), 300);
            return bands;
        },
        catch: (error) => new Error(`Failed to get user bands: ${error}`)
    }), effect_1.Effect.match({
        onSuccess: (bands) => {
            res.json(bands);
        },
        onFailure: (error) => {
            console.log(error);
            res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to get bands"
            });
        }
    }));
    await effect_1.Effect.runPromise(getUserBandsProgram);
};
exports.getBandsByUser = getBandsByUser;
/**
 * Update a band
 */
const editBand = async (req, res) => {
    const { title, description, location, image } = req.body;
    const updateBandProgram = (0, effect_1.pipe)(effect_1.Effect.tryPromise({
        try: async () => {
            const bandId = req.params.id;
            const band = await band_model_1.default.findByIdAndUpdate(bandId, {
                title,
                description,
                location,
                image,
            }, { new: true });
            if (!band) {
                throw new Error("Band not found");
            }
            // Invalidate caches
            await Promise.all([
                redis_1.RedisService.delete(`band:${req.params.id}`),
                redis_1.RedisService.delete(`user:${req.userId}:bands`),
                redis_1.RedisService.delete("bands:all")
            ]);
            return band;
        },
        catch: (error) => error instanceof Error ? error : new Error(`Failed to edit band: ${error}`)
    }), effect_1.Effect.match({
        onSuccess: (band) => {
            res.status(200).json({ message: `Band ${band.title} Updated` });
        },
        onFailure: (error) => {
            console.log(error);
            if (error.message === "Band not found") {
                res.status(404).json({ message: error.message });
            }
            else {
                res.status(500).json({
                    message: "Failed to edit Band"
                });
            }
        }
    }));
    await effect_1.Effect.runPromise(updateBandProgram);
};
exports.editBand = editBand;
/**
 * Delete a band
 */
const deleteBand = async (req, res) => {
    const deleteBandProgram = (0, effect_1.pipe)(effect_1.Effect.tryPromise({
        try: async () => {
            const bandId = req.params.id;
            const band = await band_model_1.default.findByIdAndDelete(bandId);
            if (!band) {
                throw new Error("Band not found");
            }
            // Invalidate caches
            await Promise.all([
                redis_1.RedisService.delete(`band:${req.params.id}`),
                redis_1.RedisService.delete(`user:${req.userId}:bands`),
                redis_1.RedisService.delete("bands:all")
            ]);
            return band;
        },
        catch: (error) => error instanceof Error ? error : new Error(`Failed to delete band: ${error}`)
    }), effect_1.Effect.match({
        onSuccess: () => {
            res.status(200).json("Band deleted");
        },
        onFailure: (error) => {
            console.log(error);
            if (error.message === "Band not found") {
                res.status(404).json({ message: error.message });
            }
            else {
                res.status(500).json({
                    message: "Failed to delete Band"
                });
            }
        }
    }));
    await effect_1.Effect.runPromise(deleteBandProgram);
};
exports.deleteBand = deleteBand;
