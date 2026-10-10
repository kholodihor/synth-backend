import { RequestHandler } from "express";
import BandModel from "../models/band.model";
import { RedisService } from "../utils/redis";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const invalidateBandCaches = async (userId: string, bandId?: string) => {
  const deletions = [
    RedisService.delete(`user:${userId}:bands`),
    RedisService.delete("bands:all"),
    RedisService.deleteByPattern("bands:page:*"),
  ];
  if (bandId) {
    deletions.push(RedisService.delete(`band:${bandId}`));
  }
  await Promise.all(deletions);
};

export const createBand: RequestHandler = async (req, res) => {
  const { title, description, location, image } = req.body;
  try {
    const band = await new BandModel({
      title,
      description,
      location,
      image,
      user: req.userId,
    }).save();

    await invalidateBandCaches(req.userId);

    res.status(201).json(band);
  } catch (error) {
    console.error("Create band error:", error);
    res.status(500).json({ success: false, message: "Unable to create band" });
  }
};

export const getAllBands: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const query = typeof req.query.query === "string" ? req.query.query : "";

    // No pagination requested -> return every band
    if (!req.query.page) {
      const cacheKey = "bands:all";
      const cachedBands = await RedisService.get(cacheKey);
      if (cachedBands) {
        return res.json(cachedBands);
      }

      const bands = await BandModel.find()
        .sort({ createdAt: "desc" })
        .populate("user");

      await RedisService.setWithTTL(cacheKey, bands, 300);
      return res.json(bands);
    }

    const cacheKey = `bands:page:${page}:limit:${limit}:query:${query}`;
    const cachedResult = await RedisService.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const skip = (page - 1) * limit;
    const regex = new RegExp(escapeRegex(query), "i");
    const filter = { title: { $regex: regex } };

    const [bands, totalCount] = await Promise.all([
      BandModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: "desc" })
        .populate("user"),
      BandModel.countDocuments(filter),
    ]);

    const result = {
      bands,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit,
    };

    await RedisService.setWithTTL(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
    console.error("Get bands error:", error);
    res.status(500).json({ success: false, message: "Failed to get bands" });
  }
};

export const getOneBand: RequestHandler = async (req, res) => {
  try {
    const cacheKey = `band:${req.params.id}`;
    const cachedBand = await RedisService.get(cacheKey);
    if (cachedBand) {
      return res.json(cachedBand);
    }

    const band = await BandModel.findById(req.params.id).populate("user");
    if (!band) {
      return res.status(404).json({ success: false, message: "Band not found" });
    }

    await RedisService.setWithTTL(cacheKey, band, 600);
    res.json(band);
  } catch (error) {
    console.error("Get band error:", error);
    res.status(500).json({ success: false, message: "Failed to get band" });
  }
};

export const getBandsByUser: RequestHandler = async (req, res) => {
  try {
    const cacheKey = `user:${req.userId}:bands`;
    const cachedBands = await RedisService.get(cacheKey);
    if (cachedBands) {
      return res.json(cachedBands);
    }

    const bands = await BandModel.find({ user: req.userId })
      .sort({ createdAt: "desc" })
      .populate("user");

    await RedisService.setWithTTL(cacheKey, bands, 300);
    res.json(bands);
  } catch (error) {
    console.error("Get user bands error:", error);
    res.status(500).json({ success: false, message: "Failed to get bands" });
  }
};

export const editBand: RequestHandler = async (req, res) => {
  try {
    const existing = await BandModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Band not found" });
    }
    if (existing.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "You can only edit your own bands" });
    }

    const { title, description, location, image } = req.body;
    const band = await BandModel.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, location, image } },
      { new: true }
    );

    await invalidateBandCaches(req.userId, req.params.id);

    res.json({ success: true, message: `Band ${band?.title ?? title} updated` });
  } catch (error) {
    console.error("Edit band error:", error);
    res.status(500).json({ success: false, message: "Failed to edit band" });
  }
};

export const deleteBand: RequestHandler = async (req, res) => {
  try {
    const existing = await BandModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Band not found" });
    }
    if (existing.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "You can only delete your own bands" });
    }

    await BandModel.findByIdAndDelete(req.params.id);
    await invalidateBandCaches(req.userId, req.params.id);

    res.json({ success: true, message: "Band deleted" });
  } catch (error) {
    console.error("Delete band error:", error);
    res.status(500).json({ success: false, message: "Failed to delete band" });
  }
};
