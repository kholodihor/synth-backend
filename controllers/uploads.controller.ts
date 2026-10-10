import { RequestHandler } from 'express';
import { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import cloudinary from '../libs/cloudinary';

const uploadImage = async (image: string, folder: string) => {
  const result = await cloudinary.uploader.upload(image, { folder });
  return { url: result.secure_url, publicId: result.public_id };
};

const uploadFile = async (file: UploadedFile, folder: string) => {
  const result = await cloudinary.uploader.upload(file.tempFilePath, {
    folder,
    resource_type: 'auto',
  });
  return { url: result.secure_url, fileName: file.name, publicId: result.public_id };
};

const sendError = (res: Parameters<RequestHandler>[1], error: unknown, fallback: string) => {
  console.error(`${fallback}:`, error);
  res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : fallback,
  });
};

export const uploadAvatar: RequestHandler = async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, message: 'No image provided' });
  }
  try {
    res.json({ success: true, ...(await uploadImage(image, 'users')) });
  } catch (error) {
    sendError(res, error, 'Failed to upload avatar');
  }
};

export const uploadBandImage: RequestHandler = async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, message: 'No image provided' });
  }
  try {
    res.json({ success: true, ...(await uploadImage(image, 'bands')) });
  } catch (error) {
    sendError(res, error, 'Failed to upload band image');
  }
};

export const uploadSong: RequestHandler = async (req, res) => {
  const file = req.files?.song as UploadedFile | undefined;
  if (!file) {
    return res.status(400).json({ success: false, message: 'No song file provided' });
  }
  try {
    res.json({ success: true, ...(await uploadFile(file, 'music')) });
  } catch (error) {
    sendError(res, error, 'Failed to upload song');
  }
};

const TOPSONG_DIR = path.join('uploads', 'songs', 'topsongs');

export const uploadTopSong: RequestHandler = async (req, res) => {
  const file = req.files?.topsong as UploadedFile | undefined;
  if (!file) {
    return res.status(400).json({ success: false, message: 'No song file provided' });
  }
  try {
    const fileName = path.basename(file.name); // prevent path traversal
    fs.mkdirSync(TOPSONG_DIR, { recursive: true });
    await file.mv(path.join(TOPSONG_DIR, fileName));
    res.json({ success: true, url: `/uploads/songs/topsongs/${fileName}`, fileName });
  } catch (error) {
    sendError(res, error, 'Failed to process top song');
  }
};
