const fs = require("fs");
const path = require("path");
const { kv } = require("@vercel/kv");

const HISTORY_FILE = path.join(__dirname, "..", "globalHistory.json");

module.exports = async (req, res) => {
  let { city } = req.query;
  if (!city) {
    return res.status(400).json({ error: "City required" });
  }

  const safeCity = city.toLowerCase().trim();

  try {
    // 1. Try Cloud Storage (Vercel KV)
    if (process.env.KV_URL) {
      const cloudHistory = await kv.get(`history:${safeCity}`);
      if (cloudHistory) {
        return res.status(200).json(cloudHistory);
      }
    }

    // 2. Fallback to Local Storage (JSON file)
    if (fs.existsSync(HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
      const cityHistory = data[safeCity] || [];
      return res.status(200).json(cityHistory);
    }
  } catch (err) {
    console.error("Error reading history:", err);
  }

  // Return empty if not found or error
  return res.status(200).json([]);
};
