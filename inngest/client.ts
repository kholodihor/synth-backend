import { Inngest } from "inngest";

export const inngest = new Inngest({ 
  id: "synth-backend",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
