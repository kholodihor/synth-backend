import { serve } from "inngest/next";
import { inngest } from "../inngest/client";
import { generateMusic } from "../inngest/functions/generateMusic";

// Create the Inngest serve handler for Vercel
const handler = serve({
  client: inngest,
  functions: [generateMusic],
});

// Export as default for Vercel API routes
export default handler;
