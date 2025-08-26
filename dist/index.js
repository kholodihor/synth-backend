"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const bands_routes_1 = __importDefault(require("./routes/bands.routes"));
const songs_routes_1 = __importDefault(require("./routes/songs.routes"));
const video_routes_1 = __importDefault(require("./routes/video.routes"));
const uploads_routes_1 = __importDefault(require("./routes/uploads.routes"));
const music_routes_1 = __importDefault(require("./routes/music.routes"));
const handler_1 = require("./inngest/handler");
const jobs_routes_1 = __importDefault(require("./routes/jobs.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json({ limit: "15mb" }));
app.use(body_parser_1.default.urlencoded({ extended: true, limit: "15mb" }));
app.use((0, cookie_parser_1.default)());
// Configure CORS with specific options
const allowedOrigins = ['http://localhost:5173', 'https://synth-frontend-phi.vercel.app'];
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions)); // Enable preflight for all routes
app.use((0, express_fileupload_1.default)({ useTempFiles: true }));
app.use("/uploads", express_1.default.static("uploads"));
// Health check / root route so Fly's proxy and browsers get a 200 OK
app.get('/', (_req, res) => {
    res.status(200).send('OK');
});
// Inngest functions endpoint and Jobs API
app.use("/api/inngest", handler_1.inngestHandler);
app.use("/api/jobs", jobs_routes_1.default);
app.use("/api", user_routes_1.default);
app.use("/api", bands_routes_1.default);
app.use("/api", songs_routes_1.default);
app.use("/api", video_routes_1.default);
app.use("/api", uploads_routes_1.default);
app.use("/api/music", music_routes_1.default);
mongoose_1.default.set("strictQuery", false);
// Support both env var names for Mongo connection
const mongoUri = (process.env.MONGODB_URI || process.env.MONGO_URI);
mongoose_1.default
    .connect(mongoUri, {})
    .then(() => app.listen(process.env.PORT || 4000, () => {
    console.log("Server and Database are OK");
}))
    .catch((err) => console.log("DB error", err));
