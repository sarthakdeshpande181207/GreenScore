const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

/* =========================
   GEMINI HELPER FUNCTION
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
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    },
    {
      params: {
        key: process.env.GEMINI_API_KEY
      }
    }
  );

  const text =
    response.data.candidates[0].content.parts[0].text;

  let actions = text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (actions.length > 3) actions = actions.slice(0, 3);

  return actions;
}

/* =========================
   BASIC ROUTES
   ========================= */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* =========================
   GEMINI ROUTE
   ========================= */
app.get("/gemini-test", async (req, res) => {
  const city = req.query.city || "Mumbai";
  const aqi = req.query.aqi || 150;

  let actions;
  let source = "gemini";

  try {
    actions = await getGeminiActions(city, aqi);
    console.log("✅ Gemini used");
  } catch (err) {
    console.error("❌ Gemini failed:");
    console.error(err.response?.data || err.message);

    source = "fallback";
    actions = [
      "Avoid outdoor exercise during peak pollution hours.",
      "Wear a protective mask if you step outside.",
      "Keep windows closed to reduce indoor pollution."
    ];
  }

  res.json({
    city,
    aqi,
    actions,
    source
  });
});

/* =========================
   START SERVER
   ========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
