import { Effect } from 'effect';
import BandModel from '../models/band.model';
import { RedisService } from '../utils/redis';

// Define error types for better error handling
export class BandNotFoundError extends Error {
  readonly _tag = 'BandNotFoundError';
  constructor(message: string = 'Band not found') {
    super(message);
  }
}

export class BandCreationError extends Error {
  readonly _tag = 'BandCreationError';
  constructor(message: string = 'Failed to create band') {
    super(message);
  }
}

// Effect-based band creation
export const createBand = (bandData: any, userId: string) => {
  return Effect.tryPromise({
    try: async () => {
      const { title, description, location, image } = bandData;
      
      const band = new BandModel({
        title,
        description,
        location,
        image,
        user: userId,
      });

      const savedBand = await band.save();

      // Invalidate caches
      await Promise.all([
        RedisService.delete(`user:${userId}:bands`),
        RedisService.delete("bands:all")
      ]);

      return savedBand;
    },
    catch: (error) => {
      console.error('Error creating band:', error);
      return new BandCreationError(`Failed to create band: ${error}`);
    }
  });
};

// Effect-based get all bands
export const getAllBands = (page?: number, limit?: number, query?: string) => {
  return Effect.tryPromise({
    try: async () => {
      // If no pagination is requested, return all bands
      if (!page) {
        const cacheKey = "bands:all";
        const cachedBands = await RedisService.get(cacheKey);

        if (cachedBands) {
          return cachedBands;
        }

        const bands = await BandModel.find()
          .sort({ createdAt: "desc" })
          .populate("user");

        // Cache for 5 minutes
        await RedisService.setWithTTL(cacheKey, bands, 300);

        return bands;
      }

      // Handle paginated request
      const actualLimit = limit || 6;
      const actualQuery = query || "";
      const cacheKey = `bands:page:${String(page)}:limit:${actualLimit}:query:${actualQuery}`;
      const cachedResult = await RedisService.get(cacheKey);

      if (cachedResult) {
        return cachedResult;
      }

      const skip = (page - 1) * actualLimit;
      const regex = new RegExp(actualQuery, "i");

      const [bands, totalCount] = await Promise.all([
        BandModel.find({ title: { $regex: regex } })
          .skip(skip)
          .limit(actualLimit)
          .sort({ createdAt: "desc" })
          .populate("user"),
        BandModel.countDocuments({ title: { $regex: regex } }),
      ]);

      const result = {
        bands,
        currentPage: page,
        totalPages: Math.ceil(totalCount / actualLimit),
        totalCount,
      };

      // Cache for 5 minutes
      await RedisService.setWithTTL(cacheKey, result, 300);

      return result;
    },
    catch: (error) => {
      console.error('Error getting bands:', error);
      return new Error(`Failed to get bands: ${error}`);
    }
  });
};

// Effect-based get one band
export const getOneBand = (id: string) => {
  return Effect.tryPromise({
    try: async () => {
      const cacheKey = `band:${id}`;
      const cachedBand = await RedisService.get(cacheKey);

      if (cachedBand) {
        return cachedBand;
      }

      const band = await BandModel.findById(id).populate("user");

      if (!band) {
        throw new BandNotFoundError();
      }

      // Cache for 5 minutes
      await RedisService.setWithTTL(cacheKey, band, 300);

      return band;
    },
    catch: (error) => {
      if (error instanceof BandNotFoundError) {
        return error;
      }
      console.error('Error getting band:', error);
      return new Error(`Failed to get band: ${error}`);
    }
  });
};

// Effect-based get bands by user
export const getBandsByUser = (userId: string) => {
  return Effect.tryPromise({
    try: async () => {
      const cacheKey = `user:${userId}:bands`;
      const cachedBands = await RedisService.get(cacheKey);

      if (cachedBands) {
        return cachedBands;
      }

      const bands = await BandModel.find({ user: userId })
        .sort({ createdAt: "desc" })
        .populate("user");

      // Cache for 5 minutes
      await RedisService.setWithTTL(cacheKey, bands, 300);

      return bands;
    },
    catch: (error) => {
      console.error('Error getting user bands:', error);
      return new Error(`Failed to get user bands: ${error}`);
    }
  });
};

// Effect-based edit band
export const editBand = (bandId: string, userId: string, bandData: any) => {
  return Effect.tryPromise({
    try: async () => {
      const { title, description, location, image } = bandData;
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
        throw new BandNotFoundError();
      }

      // Invalidate caches
      await Promise.all([
        RedisService.delete(`band:${bandId}`),
        RedisService.delete(`user:${userId}:bands`),
        RedisService.delete("bands:all")
      ]);

      return band;
    },
    catch: (error) => {
      if (error instanceof BandNotFoundError) {
        return error;
      }
      console.error('Error editing band:', error);
      return new Error(`Failed to edit band: ${error}`);
    }
  });
};

// Effect-based delete band
export const deleteBand = (bandId: string, userId: string) => {
  return Effect.tryPromise({
    try: async () => {
      const band = await BandModel.findByIdAndDelete(bandId);
      
      if (!band) {
        throw new BandNotFoundError();
      }

      // Invalidate caches
      await Promise.all([
        RedisService.delete(`band:${bandId}`),
        RedisService.delete(`user:${userId}:bands`),
        RedisService.delete("bands:all")
      ]);

      return { success: true, message: "Band deleted" };
    },
    catch: (error) => {
      if (error instanceof BandNotFoundError) {
        return error;
      }
      console.error('Error deleting band:', error);
      return new Error(`Failed to delete band: ${error}`);
    }
  });
};