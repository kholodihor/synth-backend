import { serve } from "inngest/express";
import { inngest } from "./client";
import { generateMusic } from "./functions/generateMusic";

// Express-compatible handler. Mount at /api/inngest
export const inngestHandler = serve({
  client: inngest,
  functions: [generateMusic],
});
