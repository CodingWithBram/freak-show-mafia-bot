"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CustomClient_1 = __importDefault(require("./base/classes/CustomClient"));
// --- Keep-Alive Web Server for Render ---
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
    res.send("✅ Bot is running and alive on Render!");
});
app.listen(PORT, () => {
    console.log(`🌐 Keep-alive server listening on port ${PORT}`);
});
// --- Start the Discord Bot ---
(new CustomClient_1.default()).Init();
