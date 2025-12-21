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
Each action should be one simple sentence.
No numbering. No emojis.
`;

  const response = await axios.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
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

  return text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/* =========================
   BASIC TEST ROUTES
   ========================= */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/test", (req, res) => {
  res.json({
    message: "API working",
    city: req.query.city || "no city sent"
  });
});

/* =========================
   GEMINI TEST ROUTE
   ========================= */
app.get("/gemini-test", async (req, res) => {
  try {
    const city = req.query.city || "Mumbai";
    const aqi = req.query.aqi || 150;

    const actions = await getGeminiActions(city, aqi);

    res.json({
      city,
      aqi,
      actions
    });
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({
      error: "Gemini failed",
      details: err.response?.data || err.message
    });
  }
});

/* =========================
   START SERVER
   ========================= */
app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
