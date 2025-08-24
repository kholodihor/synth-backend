import axios from "axios";
import { Request, Response } from "express";

const ENDPOINTS = {
  withDescribedLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_DESCRIBED_LYRICS,
  fromDescription: process.env.MODAL_ENDPOINT_GENERATE_FROM_DESCRIPTION,
  withLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_LYRICS,
  generate: process.env.MODAL_ENDPOINT_GENERATE,
};

const AXIOS_OPTS = { timeout: 15 * 60 * 1000 }; // 15 minutes

export async function generateWithDescribedLyrics(req: Request, res: Response) {
  try {
    if (!ENDPOINTS.withDescribedLyrics) {
      return res.status(500).json({ error: "Modal endpoint not configured" });
    }
    const { data } = await axios.post(ENDPOINTS.withDescribedLyrics, req.body, AXIOS_OPTS);
    return res.json(data);
  } catch (err: any) {
    const status = err.response?.status || 500;
    return res.status(status).json({ error: err.message, details: err.response?.data });
  }
}

export async function generateFromDescription(req: Request, res: Response) {
  try {
    if (!ENDPOINTS.fromDescription) {
      return res.status(500).json({ error: "Modal endpoint not configured" });
    }
    const { data } = await axios.post(ENDPOINTS.fromDescription, req.body, AXIOS_OPTS);
    return res.json(data);
  } catch (err: any) {
    const status = err.response?.status || 500;
    return res.status(status).json({ error: err.message, details: err.response?.data });
  }
}

export async function generateWithLyrics(req: Request, res: Response) {
  try {
    if (!ENDPOINTS.withLyrics) {
      return res.status(500).json({ error: "Modal endpoint not configured" });
    }
    const { data } = await axios.post(ENDPOINTS.withLyrics, req.body, AXIOS_OPTS);
    return res.json(data);
  } catch (err: any) {
    const status = err.response?.status || 500;
    return res.status(status).json({ error: err.message, details: err.response?.data });
  }
}

export async function generateTest(req: Request, res: Response) {
  try {
    if (!ENDPOINTS.generate) {
      return res.status(500).json({ error: "Modal endpoint not configured" });
    }
    const { data } = await axios.post(ENDPOINTS.generate, {}, AXIOS_OPTS);
    return res.json(data);
  } catch (err: any) {
    const status = err.response?.status || 500;
    return res.status(status).json({ error: err.message, details: err.response?.data });
  }
}
