import { serve } from "inngest/express";
import { inngest } from "../inngest/client";
import { generateMusic } from "../inngest/functions/generateMusic";

// Create the Inngest serve handler
const handler = serve({
  client: inngest,
  functions: [generateMusic],
  streaming: false,
});

// Export HTTP methods for Vercel Web API
export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}

export async function PUT(request: Request) {
  return handler(request);
}
