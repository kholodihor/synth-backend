import { Inngest } from "inngest";

export const inngest = new Inngest({ 
  id: "synth-backend",
  eventKey: process.env.INNGEST_EVENT_KEY,
  // For local development, connect to the Inngest dev server
  ...(process.env.NODE_ENV !== "production" && {
    isDev: true,
  }),
});
