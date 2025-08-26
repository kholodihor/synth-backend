import { serve } from "inngest/express";
import { inngest } from "../inngest/client";
import { generateMusic } from "../inngest/functions/generateMusic";

const inngestHandler = serve({
  client: inngest,
  functions: [generateMusic],
});

// Ensure body is not parsed so Inngest can verify signatures
export const config = { api: { bodyParser: false } };

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    // Lightweight health for manual checks
    return res.status(200).json({
      framework: "vercel-node",
      has_signing_key: Boolean(process.env.INNGEST_SIGNING_KEY),
      function_count: 1,
      authentication_succeeded: false,
    });
  }
  // Delegate to Inngest for signed POSTs and other verbs
  // @ts-ignore - Inngest handler matches Vercel signature
  return inngestHandler(req, res);
}
