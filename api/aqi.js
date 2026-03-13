const cityFallbackMap = {
  panvel: "navi mumbai",
  Panvel: "navi mumbai",
  hassan: "bengaluru",
  Hassan: "bengaluru",
  kurla: "mumbai",
  Kurla: "mumbai"
};

const axios = require("axios");

/* =========================
   GET AQI FROM AQICN
   ========================= */
async function getAQI(city, uid) {
  let url;
  if (uid) {
    url = `https://api.waqi.info/feed/@${uid}/?token=${process.env.AQICN_TOKEN}`;
  } else {
    try {
      // 1. Universal Geocoding: Get exact lat/lon for the typed city
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`, {
        headers: { "User-Agent": "GreenScoreApp/1.0" }
      });
      const nomData = await nomRes.json();
      if (nomData && nomData.length > 0) {
        const lat = nomData[0].lat;
        const lon = nomData[0].lon;
        url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${process.env.AQICN_TOKEN}`;
      } else {
        url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${process.env.AQICN_TOKEN}`;
      }
    } catch (err) {
      console.error("Nominatim geocoding error:", err);
      url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${process.env.AQICN_TOKEN}`;
    }
  }

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "ok" || data.data.aqi === 0 || data.data.aqi === null) {
    if (!uid) {
      // Very last resort if Nominatim geometry failed in AQICN database
      const fbUrl = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${process.env.AQICN_TOKEN}`;
      const fbRes = await fetch(fbUrl);
      const fbData = await fbRes.json();
      if (fbData.status === "ok" && fbData.data.aqi !== 0 && fbData.data.aqi !== null) {
        return {
          aqi: fbData.data.aqi,
          lat: fbData.data.city.geo[0],
          lon: fbData.data.city.geo[1]
        };
      }
    }
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

  // Rate Limiter
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const now = Date.now();
  if (!global.aqiRateLimit) global.aqiRateLimit = new Map();
  let requests = global.aqiRateLimit.get(ip) || [];
  requests = requests.filter(time => now - time < 60000); // 1 minute window
  if (requests.length >= 15) {
    return res.status(429).json({ 
      error: "rate_limit", 
      message: "Security Notice: Rate limit exceeded. Please wait 60 seconds." 
    });
  }
  requests.push(now);
  global.aqiRateLimit.set(ip, requests);

  try {
    // We can fetch AQI first, then pass it to Gemini.
    // However, if AQI is fast but Gemini is slow, we can just fetch them in parallel 
    // without passing AQI to Gemini (it knows the general AQI of a city usually anyway),
    // or we can keep them sequential but use `fetch` to fix the Windows DNS bug.
    //
    // Since the prompt requires AQI, we'll keep them sequential but use native fetch!
    const uid = req.query.uid;
    const { aqi, lat, lon } = await getAQI(city, uid);
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
    console.error("Backend Error Detail:", err);

    // If it's a network/connection error, alert the frontend specifically
    // Check for common connection error codes or messages
    const errorMsg = (err.message || "").toLowerCase();
    const isNetworkError = errorMsg.includes("fetch failed") || 
                           errorMsg.includes("enotfound") || 
                           errorMsg.includes("etimedout") || 
                           errorMsg.includes("econnrefused") ||
                           errorMsg.includes("socket") ||
                           errorMsg.includes("network") ||
                           err.code === "ENOTFOUND" ||
                           err.code === "ETIMEDOUT";

    if (isNetworkError) {
      return res.status(503).json({ 
        error: "connection", 
        message: "Satellite connection failed." 
      });
    }

    // Default fallback (e.g. city not found in AQICN database specifically)
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
