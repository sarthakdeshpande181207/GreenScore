const axios = require("axios");

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
   VERCEL HANDLER
   ========================= */
module.exports = async (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.status(400).json({ error: "City required" });
  }

  try {
    const aqi = await getAQI(city);
    const actions = await getGeminiActions(city, aqi);

    res.status(200).json({
      city,
      aqi,
      actions,
      source: "aqicn + gemini"
    });
  } catch (err) {
    console.error(err.message);

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
