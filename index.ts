import express, { Express, ErrorRequestHandler } from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import fileupload from "express-fileupload";

import userRoute from "./routes/user.routes";
import bandRoute from "./routes/bands.routes";
import songRoute from "./routes/songs.routes";
import videoRoute from "./routes/video.routes";
import uploadsRoute from "./routes/uploads.routes";
import musicRoute from "./routes/music.routes";
import jobsRoutes from "./routes/jobs.routes";
import { inngestHandler } from "./inngest/handler";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGODB_URI (or MONGO_URI) is not configured");
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");

const PORT = process.env.PORT || 4000;

const app: Express = express();

app.use(helmet());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());

app.use("/api/inngest", inngestHandler);

// Comma-separated list, e.g. CORS_ORIGINS=http://localhost:5173,https://example.com
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:5173,https://synth-frontend-phi.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("The CORS policy for this site does not allow access from the specified Origin."));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(fileupload({ useTempFiles: true, tempFileDir: "tmp/" }));
app.use("/uploads", express.static("uploads"));

// Health check / root route so Fly's proxy and browsers get a 200 OK
app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.use("/api/jobs", jobsRoutes);
app.use("/api/music", musicRoute);
app.use("/api", userRoute);
app.use("/api", bandRoute);
app.use("/api", songRoute);
app.use("/api", videoRoute);
app.use("/api", uploadsRoute);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : err.message,
  });
};
app.use(errorHandler);

mongoose.set("strictQuery", false);

mongoose
  .connect(mongoUri)
  .then(() =>
    app.listen(PORT, () => {
      console.log(`Server and Database are OK. Server running on port ${PORT}`);
    })
  )
  .catch((err) => {
    console.error("DB error", err);
    process.exit(1);
  });
