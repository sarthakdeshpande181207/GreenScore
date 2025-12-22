const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

/* =========================
   GET AQI FROM AQICN
   ========================= */
async function getAQI(city) {
  const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${process.env.AQICN_TOKEN}`;
  const response = await axios.get(url);

  if (response.data.status !== "ok") {
    throw new Error("AQICN failed");
  }

  return response.data.data.aqi;
}

/* =========================
   GEMINI HELPER
   ========================= */
async function getGeminiActions(city, aqi) {
  const prompt = `
City: ${city}
AQI: ${aqi}

Give exactly 3 short health actions for today.
Return each action on a new line.
Do not number them.
Do not use emojis.
Do not add extra text.
`;

  const response = await axios.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    {
      contents: [{ parts: [{ text: prompt }] }]
    },
    {
      params: { key: process.env.GEMINI_API_KEY }
    }
  );

  const text = response.data.candidates[0].content.parts[0].text;

  return text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 3);
}

/* =========================
   AQI + GEMINI ROUTE
   ========================= */
app.get("/aqi", async (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.status(400).json({ error: "City required" });
  }

  try {
    const aqi = await getAQI(city);
    const actions = await getGeminiActions(city, aqi);

    res.json({
      city,
      aqi,
      actions,
      source: "aqicn + gemini"
    });
  } catch (err) {
    console.error(err.message);

    res.json({
      city,
      aqi: null,
      actions: [
        "Avoid outdoor exercise today.",
        "Wear a protective mask when going outside.",
        "Keep windows closed to reduce indoor pollution."
      ],
      source: "fallback"
    });
  }
});

/* =========================
   START SERVER
   ========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
