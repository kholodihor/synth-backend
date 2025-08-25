"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BandController = __importStar(require("./band.controller"));
const checkAuth_1 = require("../middleware/checkAuth");
const bandValidation_1 = require("../validations/BandValidation/bandValidation");
/**
 * Effect-based router for band operations
 * This router uses the Effect-based controller while maintaining
 * the same API endpoints and middleware as the original
 */
const router = (0, express_1.Router)();
router.get('/bands', BandController.getAllBands);
router.get('/bands/:id', BandController.getOneBand);
router.get('/user/bands', checkAuth_1.checkAuth, BandController.getBandsByUser);
router.patch('/bands/:id', checkAuth_1.checkAuth, BandController.editBand);
router.delete('/bands/:id', checkAuth_1.checkAuth, BandController.deleteBand);
router.post('/bands', checkAuth_1.checkAuth, bandValidation_1.createBandValidation, BandController.createBand);
exports.default = router;
