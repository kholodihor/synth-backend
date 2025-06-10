import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import fileupload from "express-fileupload";

import userRoute from "./routes/user.routes";
import bandRoute from "./routes/bands.routes";
import songRoute from "./routes/songs.routes";
import videoRoute from "./routes/video.routes";
import uploadsRoute from "./routes/uploads.routes";

dotenv.config();

const app: Express = express();

app.use(bodyParser.json({ limit: "15mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());

// Configure CORS with specific options
const allowedOrigins = ['http://localhost:5173', 'https://synth-frontend-phi.vercel.app'];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes

app.use(fileupload({ useTempFiles: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api", userRoute);
app.use("/api", bandRoute);
app.use("/api", songRoute);
app.use("/api", videoRoute);
app.use("/api", uploadsRoute);

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URI as string, {})
  .then(() =>
    app.listen(process.env.PORT || 4000, () => {
      console.log("Server and Database are OK");
    })
  )
  .catch((err) => console.log("DB error", err));
