import axios from "axios";
import { Request, Response } from "express";

const ENDPOINTS = {
  withDescribedLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_DESCRIBED_LYRICS,
  fromDescription: process.env.MODAL_ENDPOINT_GENERATE_FROM_DESCRIPTION,
  withLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_LYRICS,
  generate: process.env.MODAL_ENDPOINT_GENERATE,
} as const;

type EndpointKind = keyof typeof ENDPOINTS;

const AXIOS_OPTS = { timeout: 15 * 60 * 1000 }; // 15 minutes

const proxyToModal = (kind: EndpointKind, buildPayload: (body: unknown) => unknown) =>
  async (req: Request, res: Response) => {
    const endpoint = ENDPOINTS[kind];
    try {
      if (!endpoint) {
        return res.status(500).json({ error: "Modal endpoint not configured" });
      }
      const { data } = await axios.post(endpoint, buildPayload(req.body), AXIOS_OPTS);
      return res.json(data);
    } catch (err: any) {
      const status = err.response?.status || 500;
      return res.status(status).json({ error: err.message, details: err.response?.data });
    }
  };

const passThrough = (body: unknown) => body;

export const generateWithDescribedLyrics = proxyToModal("withDescribedLyrics", passThrough);
export const generateFromDescription = proxyToModal("fromDescription", passThrough);
export const generateWithLyrics = proxyToModal("withLyrics", passThrough);
export const generateTest = proxyToModal("generate", () => ({}));
