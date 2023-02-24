import { RequestHandler } from 'express';
import BandModel from '../models/BandModel';

type Params = {};
type ResBody = {};
type ReqBody = {};
type ReqQuery = {
  page: number;
  query: string;
};

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
    const newBand = await band.save();
    res.status(200).json(newBand);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Unable to create Band',
    });
  }
};

export const getAllBands: RequestHandler = async (req, res) => {
  try {
    const bands = await BandModel.find()
      .sort({ createdAt: 'desc' })
      .populate('user')
      .exec();
    res.status(200).json(bands);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Can`t get bands',
    });
  }
};

export const getAllBandsPaginate: RequestHandler<
  Params,
  ResBody,
  ReqBody,
  ReqQuery
> = async (req, res) => {
  const page = req.query.page || 1;
  const bandsPerPage = 6;
  let skip;
  if (page == 1) {
    skip = 0;
  } else {
    skip = page * bandsPerPage - bandsPerPage;
  }
  try {
    const bands = await BandModel.find()
      .sort({ createdAt: 'desc' })
      .skip(skip)
      .limit(bandsPerPage)
      .populate('user')
      .exec();
    res.status(200).json(bands);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Can`t get bands',
    });
  }
};

export const getOneBand: RequestHandler = async (req, res) => {
  const bandId = req.params.id;
  try {
    const band = await BandModel.findById({ _id: bandId });
    res.json(band);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Can`t get Band',
    });
  }
};

export const getBandsByUser: RequestHandler = async (req, res) => {
  try {
    const bands = await BandModel.find({ user: req.userId }).sort({
      createdAt: 'desc',
    });
    res.json(bands);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Can`t get Band',
    });
  }
};

export const editBand: RequestHandler = async (req, res) => {
  try {
    const bandId = req.params.id;
    const { title, description, location, image } = req.body;
    await BandModel.updateOne(
      { _id: bandId },
      {
        title,
        description,
        location,
        image,
        user: req.userId,
      }
    );
    res.status(200).json({ message: `Band ${title} Updated` });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Fail to edit Band',
    });
  }
};

export const deleteBand: RequestHandler = async (req, res) => {
  try {
    const bandId = req.params.id;
    await BandModel.findOneAndDelete({ _id: bandId });
    res.status(200).json('Band deleted');
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Fail to delete Band',
    });
  }
};
