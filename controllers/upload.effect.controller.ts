import { RequestHandler } from "express";
import { Effect } from "effect";
import * as UploadService from "../services/upload.service";

export const uploadAvatar: RequestHandler = async (req, res) => {
  console.log('Upload avatar request');
  
  // Get the image from request body
  const { image } = req.body;
  
  // Validation should already be handled by middleware, but double check
  if (!image) {
    return res.status(400).json({ 
      message: "No image provided", 
      field: "image",
      success: false 
    });
  }
  
  Effect.runPromise(UploadService.uploadAvatar(image))
    .then(result => {
      res.json({
        ...result,
        success: true
      });
    })
    .catch(error => {
      console.error('Error in uploadAvatar controller:', error);
      
      if (error._tag === 'FileNotProvidedError') {
        res.status(400).json({ 
          message: error.message, 
          field: "image",
          success: false 
        });
      } else if (error._tag === 'UploadError') {
        res.status(500).json({ 
          message: error.message,
          success: false 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to upload avatar",
          success: false 
        });
      }
    });
};

export const uploadBandImage: RequestHandler = async (req, res) => {
  console.log('Upload band image request');
  
  // Get the image from request body
  const { image } = req.body;
  
  // Validation should already be handled by middleware, but double check
  if (!image) {
    return res.status(400).json({ 
      message: "No image provided", 
      field: "image",
      success: false 
    });
  }
  
  Effect.runPromise(UploadService.uploadBandImage(image))
    .then(result => {
      res.json({
        ...result,
        success: true
      });
    })
    .catch(error => {
      console.error('Error in uploadBandImage controller:', error);
      
      if (error._tag === 'FileNotProvidedError') {
        res.status(400).json({ 
          message: error.message, 
          field: "image",
          success: false 
        });
      } else if (error._tag === 'UploadError') {
        res.status(500).json({ 
          message: error.message,
          success: false 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to upload band image",
          success: false 
        });
      }
    });
};

export const uploadSong: RequestHandler = async (req, res) => {
  console.log('Upload song request');
  
  // Get the file from multer middleware
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ message: "No song provided" });
  }
  
  Effect.runPromise(UploadService.uploadSong(file))
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      console.error('Error in uploadSong controller:', error);
      
      if (error._tag === 'FileNotProvidedError') {
        res.status(400).json({ message: error.message });
      } else if (error._tag === 'UploadError') {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to upload song" });
      }
    });
};