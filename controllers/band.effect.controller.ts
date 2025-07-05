import { RequestHandler } from "express";
import { Effect } from "effect";
import * as BandService from "../services/band.service";

interface BandQuery {
  page?: string;
  limit?: string;
  query?: string;
}

export const createBand: RequestHandler = async (req, res) => {
  const userId = req.userId as string;
  console.log('Create band request for userId:', userId);
  
  Effect.runPromise(BandService.createBand(req.body, userId))
    .then(band => {
      res.status(200).json(band);
    })
    .catch(error => {
      if (error._tag === 'BandCreationError') {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Error in createBand controller:', error);
        res.status(500).json({ message: "Unable to create Band" });
      }
    });
};

export const getAllBands: RequestHandler<{}, {}, {}, BandQuery> = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
  const query = req.query.query;
  
  Effect.runPromise(BandService.getAllBands(page, limit, query))
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      console.error('Error in getAllBands controller:', error);
      res.status(500).json({ message: "Failed to get bands" });
    });
};

export const getOneBand: RequestHandler = async (req, res) => {
  const bandId = req.params.id;
  
  Effect.runPromise(BandService.getOneBand(bandId))
    .then(band => {
      res.json(band);
    })
    .catch(error => {
      if (error._tag === 'BandNotFoundError') {
        res.status(404).json({ message: "Band not found" });
      } else {
        console.error('Error in getOneBand controller:', error);
        res.status(500).json({ message: "Failed to get band" });
      }
    });
};

export const getBandsByUser: RequestHandler = async (req, res) => {
  const userId = req.userId as string;
  console.log('Get bands by user request for userId:', userId);
  
  Effect.runPromise(BandService.getBandsByUser(userId))
    .then(bands => {
      res.json(bands);
    })
    .catch(error => {
      console.error('Error in getBandsByUser controller:', error);
      res.status(500).json({ message: "Failed to get bands" });
    });
};

export const editBand: RequestHandler = async (req, res) => {
  const bandId = req.params.id;
  const userId = req.userId as string;
  console.log('Edit band request for bandId:', bandId);
  
  Effect.runPromise(BandService.editBand(bandId, userId, req.body))
    .then(band => {
      res.status(200).json({ message: `Band ${req.body.title} Updated`, band });
    })
    .catch(error => {
      if (error._tag === 'BandNotFoundError') {
        res.status(404).json({ message: "Band not found" });
      } else {
        console.error('Error in editBand controller:', error);
        res.status(500).json({ message: "Fail to edit Band" });
      }
    });
};

export const deleteBand: RequestHandler = async (req, res) => {
  const bandId = req.params.id;
  const userId = req.userId as string;
  console.log('Delete band request for bandId:', bandId);
  
  Effect.runPromise(BandService.deleteBand(bandId, userId))
    .then(result => {
      res.status(200).json(result.message);
    })
    .catch(error => {
      if (error._tag === 'BandNotFoundError') {
        res.status(404).json({ message: "Band not found" });
      } else {
        console.error('Error in deleteBand controller:', error);
        res.status(500).json({ message: "Fail to delete Band" });
      }
    });
};