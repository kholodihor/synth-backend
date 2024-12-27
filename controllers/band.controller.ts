import { RequestHandler } from "express";
import BandModel from "../models/band.model";
import { RedisService } from "../utils/redis";

interface BandQuery {
  page?: string;
  limit?: string;
  query?: string;
}

export const createBand: RequestHandler = async (req, res) => {
  const { title, description, location, image } = req.body;
  try {
    const band = new BandModel({
      title,
      description,
      location,
      image,
      user: req.userId,
    });

    await band.save();

    // Invalidate caches
    await Promise.all([
      RedisService.delete(`user:${req.userId}:bands`),
      RedisService.delete("bands:all")
    ]);

    res.status(200).json(band);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Unable to create Band",
    });
  }
};

export const getAllBands: RequestHandler<{}, {}, {}, BandQuery> = async (req, res) => {
  try {
    const page = parseInt(req.query.page as unknown as string) || 1;
    const limit = parseInt(req.query.limit as unknown as string) || 6;
    const query = req.query.query || "";

    // If no pagination is requested, return all bands
    if (!req.query.page) {
      const cacheKey = "bands:all";
      const cachedBands = await RedisService.get(cacheKey);

      if (cachedBands) {
        return res.json(JSON.parse(cachedBands));
      }

      const bands = await BandModel.find()
        .sort({ createdAt: "desc" })
        .populate("user");

      // Cache for 5 minutes
      await RedisService.setWithTTL(cacheKey, JSON.stringify(bands), 300);

      return res.json(bands);
    }

    // Handle paginated request
    const cacheKey = `bands:page:${String(page)}:limit:${limit}:query:${query}`;
    const cachedResult = await RedisService.get(cacheKey);

    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }

    const skip = (page - 1) * limit;
    const regex = new RegExp(query, "i");

    const [bands, totalCount] = await Promise.all([
      BandModel.find({ title: { $regex: regex } })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: "desc" })
        .populate("user"),
      BandModel.countDocuments({ title: { $regex: regex } }),
    ]);

    const result = {
      bands,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit,
    };

    // Cache for 5 minutes
    await RedisService.setWithTTL(cacheKey, JSON.stringify(result), 300);

    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to get bands",
    });
  }
};

export const getOneBand: RequestHandler = async (req, res) => {
  try {
    const cacheKey = `band:${req.params.id}`;
    const cachedBand = await RedisService.get(cacheKey);

    if (cachedBand) {
      return res.json(JSON.parse(cachedBand));
    }

    const band = await BandModel.findById(req.params.id).populate("user");
    if (!band) {
      return res.status(404).json({
        message: "Band not found",
      });
    }

    // Cache for 10 minutes
    await RedisService.setWithTTL(cacheKey, JSON.stringify(band), 600);

    res.json(band);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to get band",
    });
  }
};

export const getBandsByUser: RequestHandler = async (req, res) => {
  try {
    const cacheKey = `user:${req.userId}:bands`;
    const cachedBands = await RedisService.get(cacheKey);

    if (cachedBands) {
      return res.json(JSON.parse(cachedBands));
    }

    const bands = await BandModel.find({ user: req.userId })
      .sort({ createdAt: "desc" })
      .populate("user");

    // Cache for 5 minutes
    await RedisService.setWithTTL(cacheKey, JSON.stringify(bands), 300);

    res.json(bands);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to get bands",
    });
  }
};

export const editBand: RequestHandler = async (req, res) => {
  try {
    const bandId = req.params.id;
    const { title, description, location, image } = req.body;
    const band = await BandModel.findByIdAndUpdate(
      bandId,
      {
        title,
        description,
        location,
        image,
      },
      { new: true }
    );

    if (!band) {
      return res.status(404).json({
        message: "Band not found",
      });
    }

    // Invalidate caches
    await Promise.all([
      RedisService.delete(`band:${req.params.id}`),
      RedisService.delete(`user:${req.userId}:bands`),
      RedisService.delete("bands:all")
    ]);

    res.status(200).json({ message: `Band ${title} Updated` });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to edit Band",
    });
  }
};

export const deleteBand: RequestHandler = async (req, res) => {
  try {
    const bandId = req.params.id;
    const band = await BandModel.findByIdAndDelete(bandId);
    if (!band) {
      return res.status(404).json({
        message: "Band not found",
      });
    }

    // Invalidate caches
    await Promise.all([
      RedisService.delete(`band:${req.params.id}`),
      RedisService.delete(`user:${req.userId}:bands`),
      RedisService.delete("bands:all")
    ]);

    res.status(200).json("Band deleted");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to delete Band",
    });
  }
};
