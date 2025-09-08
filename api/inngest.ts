import { serve } from "inngest/express";
import { inngest } from "../inngest/client";
import { generateMusic } from "../inngest/functions/generateMusic";

// Create the Inngest serve handler for Vercel
const handler = serve({
  client: inngest,
  functions: [generateMusic],
  streaming: false,
});

export default handler;
