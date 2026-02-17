const fs = require("fs");
const axios = require("axios");

function logToFile(msg) {
  const logMsg = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync("server_debug.log", logMsg); } catch (e) { }
}

/* =========================
   GET AQI FROM AQICN
   ========================= */
async function getAQI(city) {
  const token = process.env.AQICN_TOKEN ? process.env.AQICN_TOKEN.trim() : "";
  const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${token}`;

  logToFile(`Requesting AQI for: ${city} (Token length: ${token.length})`);
  logToFile(`URL: ${url.replace(token, "MASKED")}`);

  try {
    const response = await axios.get(url);

    if (response.data.status !== "ok") {
      logToFile(`AQICN Response Error: ${JSON.stringify(response.data)}`);
      throw new Error(`AQICN failed: ${JSON.stringify(response.data.data)}`);
    }

    logToFile(`AQICN Success: AQI ${response.data.data.aqi}`);
    return response.data.data.aqi;
  } catch (error) {
    if (error.response) {
      logToFile(`Axios Error Status: ${error.response.status}`);
      logToFile(`Axios Error Data: ${JSON.stringify(error.response.data)}`);
    } else {
      logToFile(`Axios Error: ${error.message}`);
    }
    throw error;
  }
}

/* =========================
   GEOCODE CITY (SERVER-SIDE)
   ========================= */
async function geocodeCity(city) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    city
  )}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "GreenScoreApp/1.0 (https://localhost)"
      }
    });

    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error("No geocoding results");
    }

    const first = response.data[0];
    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      throw new Error("Invalid geocoding coordinates");
    }

    return { lat, lon };
  } catch (err) {
    logToFile(`Geocoding error for "${city}": ${err.message}`);
    return { lat: null, lon: null };
  }
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
   VERCEL HANDLER
   ========================= */
module.exports = async (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.status(400).json({ error: "City required" });
  }

  if (!process.env.AQICN_TOKEN) {
    console.error("AQICN_TOKEN is missing in .env");
    return res.status(500).json({ error: "Server misconfiguration: Missing AQICN_TOKEN" });
  }

  try {
    const aqi = await getAQI(city);
    const { lat, lon } = await geocodeCity(city);

    let actions = [];
    try {
      if (process.env.GEMINI_API_KEY) {
        actions = await getGeminiActions(city, aqi);
      } else {
        console.log("Gemini API Key missing, using default actions.");
        throw new Error("No Gemini Key");
      }
    } catch (geminiErr) {
      console.error("Gemini Error:", geminiErr.message);
      actions = [
        "Avoid outdoor exercise today.",
        "Wear a protective mask when going outside.",
        "Keep windows closed to reduce indoor pollution."
      ];
    }

    res.status(200).json({
      city,
      aqi,
      actions,
      source: "aqicn + gemini",
      lat,
      lon
    });
  } catch (err) {
    console.error("Error details:", err.message);
    if (err.response) {
      console.error("API Response Status:", err.response.status);
      console.error("API Response Data:", JSON.stringify(err.response.data));
    }

    res.status(200).json({
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
};
