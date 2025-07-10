import { Effect, pipe } from 'effect';
import { RequestHandler } from 'express';
import BandModel from '../models/band.model';
import { RedisService } from '../utils/redis';

/**
 * Effect-based controller for band operations
 * This controller uses Effect for error handling and functional composition
 * while maintaining compatibility with the existing model
 */

/**
 * Create a new band
 */
export const createBand: RequestHandler = async (req, res) => {
  const { title, description, location, image } = req.body;
  
  const program = pipe(
    Effect.tryPromise({
      try: async () => {
        const band = new BandModel({
          title,
          description,
          location,
          image,
          user: req.userId,
        });

        return await band.save();
      },
      catch: (error) => new Error(`Failed to create band: ${error}`)
    }),
    Effect.flatMap((band) => 
      Effect.tryPromise({
        try: async () => {
          // Invalidate caches
          await Promise.all([
            RedisService.delete(`user:${req.userId}:bands`),
            RedisService.delete("bands:all")
          ]);
          return band;
        },
        catch: (error) => new Error(`Failed to invalidate cache: ${error}`)
      })
    ),
    Effect.match({
      onSuccess: (band) => {
        res.status(200).json(band);
      },
      onFailure: (error) => {
        console.log(error);
        res.status(500).json({
          message: error instanceof Error ? error.message : "Unable to create Band"
        });
      }
    })
  );

  // Run the Effect program
  await Effect.runPromise(program);
};

/**
 * Get all bands with optional pagination
 */
export const getAllBands: RequestHandler = async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 6;
  const query = req.query.query || "";

  // If no pagination is requested, return all bands
  if (!req.query.page) {
    const getAllBandsProgram = pipe(
      Effect.tryPromise({
        try: async () => {
          const cacheKey = "bands:all";
          const cachedBands = await RedisService.get(cacheKey);

          if (cachedBands) {
            return JSON.parse(cachedBands);
          }

          const bands = await BandModel.find()
            .sort({ createdAt: "desc" })
            .populate("user");

          // Cache for 5 minutes
          await RedisService.setWithTTL(cacheKey, JSON.stringify(bands), 300);

          return bands;
        },
        catch: (error) => new Error(`Failed to get all bands: ${error}`)
      }),
      Effect.match({
        onSuccess: (bands) => {
          res.json(bands);
        },
        onFailure: (error) => {
          console.log(error);
          res.status(500).json({
            message: error instanceof Error ? error.message : "Failed to get bands"
          });
        }
      })
    );

    await Effect.runPromise(getAllBandsProgram);
    return;
  }

  // Handle paginated request
  const getPaginatedBandsProgram = pipe(
    Effect.tryPromise({
      try: async () => {
        const cacheKey = `bands:page:${String(page)}:limit:${limit}:query:${query}`;
        const cachedResult = await RedisService.get(cacheKey);

        if (cachedResult) {
          return JSON.parse(cachedResult);
        }

        const skip = (page - 1) * limit;
        const regex = new RegExp(query as string, "i");

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

        return result;
      },
      catch: (error) => new Error(`Failed to get paginated bands: ${error}`)
    }),
    Effect.match({
      onSuccess: (result) => {
        res.json(result);
      },
      onFailure: (error) => {
        console.log(error);
        res.status(500).json({
          message: error instanceof Error ? error.message : "Failed to get bands"
        });
      }
    })
  );

  await Effect.runPromise(getPaginatedBandsProgram);
};

/**
 * Get a single band by ID
 */
export const getOneBand: RequestHandler = async (req, res) => {
  const getBandProgram = pipe(
    Effect.tryPromise({
      try: async () => {
        const cacheKey = `band:${req.params.id}`;
        const cachedBand = await RedisService.get(cacheKey);

        if (cachedBand) {
          return JSON.parse(cachedBand);
        }

        const band = await BandModel.findById(req.params.id).populate("user");
        
        if (!band) {
          throw new Error("Band not found");
        }

        // Cache for 10 minutes
        await RedisService.setWithTTL(cacheKey, JSON.stringify(band), 600);

        return band;
      },
      catch: (error) => error instanceof Error ? error : new Error(`Failed to get band: ${error}`)
    }),
    Effect.match({
      onSuccess: (band) => {
        res.json(band);
      },
      onFailure: (error) => {
        console.log(error);
        if (error.message === "Band not found") {
          res.status(404).json({ message: error.message });
        } else {
          res.status(500).json({
            message: "Failed to get band"
          });
        }
      }
    })
  );

  await Effect.runPromise(getBandProgram);
};

/**
 * Get bands by user ID
 */
export const getBandsByUser: RequestHandler = async (req, res) => {
  const getUserBandsProgram = pipe(
    Effect.tryPromise({
      try: async () => {
        const cacheKey = `user:${req.userId}:bands`;
        const cachedBands = await RedisService.get(cacheKey);

        if (cachedBands) {
          return JSON.parse(cachedBands);
        }

        const bands = await BandModel.find({ user: req.userId })
          .sort({ createdAt: "desc" })
          .populate("user");

        // Cache for 5 minutes
        await RedisService.setWithTTL(cacheKey, JSON.stringify(bands), 300);

        return bands;
      },
      catch: (error) => new Error(`Failed to get user bands: ${error}`)
    }),
    Effect.match({
      onSuccess: (bands) => {
        res.json(bands);
      },
      onFailure: (error) => {
        console.log(error);
        res.status(500).json({
          message: error instanceof Error ? error.message : "Failed to get bands"
        });
      }
    })
  );

  await Effect.runPromise(getUserBandsProgram);
};

/**
 * Update a band
 */
export const editBand: RequestHandler = async (req, res) => {
  const { title, description, location, image } = req.body;
  
  const updateBandProgram = pipe(
    Effect.tryPromise({
      try: async () => {
        const bandId = req.params.id;
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
          throw new Error("Band not found");
        }

        // Invalidate caches
        await Promise.all([
          RedisService.delete(`band:${req.params.id}`),
          RedisService.delete(`user:${req.userId}:bands`),
          RedisService.delete("bands:all")
        ]);

        return band;
      },
      catch: (error) => error instanceof Error ? error : new Error(`Failed to edit band: ${error}`)
    }),
    Effect.match({
      onSuccess: (band) => {
        res.status(200).json({ message: `Band ${band.title} Updated` });
      },
      onFailure: (error) => {
        console.log(error);
        if (error.message === "Band not found") {
          res.status(404).json({ message: error.message });
        } else {
          res.status(500).json({
            message: "Failed to edit Band"
          });
        }
      }
    })
  );

  await Effect.runPromise(updateBandProgram);
};

/**
 * Delete a band
 */
export const deleteBand: RequestHandler = async (req, res) => {
  const deleteBandProgram = pipe(
    Effect.tryPromise({
      try: async () => {
        const bandId = req.params.id;
        const band = await BandModel.findByIdAndDelete(bandId);
        
        if (!band) {
          throw new Error("Band not found");
        }

        // Invalidate caches
        await Promise.all([
          RedisService.delete(`band:${req.params.id}`),
          RedisService.delete(`user:${req.userId}:bands`),
          RedisService.delete("bands:all")
        ]);

        return band;
      },
      catch: (error) => error instanceof Error ? error : new Error(`Failed to delete band: ${error}`)
    }),
    Effect.match({
      onSuccess: () => {
        res.status(200).json("Band deleted");
      },
      onFailure: (error) => {
        console.log(error);
        if (error.message === "Band not found") {
          res.status(404).json({ message: error.message });
        } else {
          res.status(500).json({
            message: "Failed to delete Band"
          });
        }
      }
    })
  );

  await Effect.runPromise(deleteBandProgram);
};
