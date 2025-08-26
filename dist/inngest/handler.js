"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inngestHandler = void 0;
const express_1 = require("inngest/express");
const client_1 = require("./client");
const generateMusic_1 = require("./functions/generateMusic");
// Express-compatible handler. Mount at /api/inngest
exports.inngestHandler = (0, express_1.serve)({
    client: client_1.inngest,
    functions: [generateMusic_1.generateMusic],
});
