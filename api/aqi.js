const cityFallbackMap = {
  panvel: "navi mumbai",
  Panvel: "navi mumbai",
  hassan: "bengaluru",
  Hassan: "bengaluru"
};

const axios = require("axios");

/* =========================
   GET AQI FROM AQICN
   ========================= */
async function getAQI(city) {
  const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${process.env.AQICN_TOKEN}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "ok" || data.data.aqi === 0 || data.data.aqi === null) {
    throw new Error("Sensor error or offline: AQI is 0 or null");
  }

  return {
    aqi: data.data.aqi,
    lat: data.data.city.geo[0],
    lon: data.data.city.geo[1]
  };
}

/* =========================
   GEMINI HELPER
   ========================= */
async function getGeminiActions(city, aqi) {
  const prompt = `
City: ${city}
${aqi ? `AQI: ${aqi}` : ''}

Give exactly 3 short health actions for today.
Return each action on a new line.
Do not number them.
Do not use emojis.
Do not add extra text.
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Gemini failed: ${data.error?.message || response.status}`);
  }

  const text = data.candidates[0].content.parts[0].text;

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
}

/* =========================
   VERCEL HANDLER
   ========================= */
module.exports = async (req, res) => {
  const originalCity = req.query.city;
  let city = originalCity?.toLowerCase();

  if (city && cityFallbackMap[city]) {
    city = cityFallbackMap[city];
  }

  if (!city) {
    return res.status(400).json({ error: "City required" });
  }

  try {
    // We can fetch AQI first, then pass it to Gemini.
    // However, if AQI is fast but Gemini is slow, we can just fetch them in parallel 
    // without passing AQI to Gemini (it knows the general AQI of a city usually anyway),
    // or we can keep them sequential but use `fetch` to fix the Windows DNS bug.
    //
    // Since the prompt requires AQI, we'll keep them sequential but use native fetch!
    const { aqi, lat, lon } = await getAQI(city);
    const actions = await getGeminiActions(city, aqi);

    res.status(200).json({
      city,
      originalCity: originalCity.toLowerCase() !== city.toLowerCase() ? originalCity : null,
      aqi,
      lat,
      lon,
      actions,
      source: "aqicn + gemini",
    });
  } catch (err) {
    console.error(err.message);

    res.status(200).json({
      city,
      originalCity: originalCity.toLowerCase() !== city.toLowerCase() ? originalCity : null,
      aqi: null,
      actions: [
        "Avoid outdoor exercise today.",
        "Wear a protective mask when going outside.",
        "Keep windows closed to reduce indoor pollution.",
      ],
      source: "fallback",
    });
  }
};
