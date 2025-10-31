import express from "express";
import CustomClient from "./base/classes/CustomClient";

// --- Keep-Alive Web Server for Render ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✅ Bot is running and alive on Render!");
});

app.listen(PORT, () => {
  console.log(`🌐 Keep-alive server listening on port ${PORT}`);
});

// --- Start the Discord Bot ---
(new CustomClient).Init();
