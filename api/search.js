const axios = require("axios");

module.exports = async (req, res) => {
  const keyword = req.query.keyword;

  if (!keyword || keyword.trim() === "") {
    return res.status(600).json([]);
  }

  // Rate Limiter
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const now = Date.now();
  if (!global.searchRateLimit) global.searchRateLimit = new Map();
  let requests = global.searchRateLimit.get(ip) || [];
  requests = requests.filter(time => now - time < 60000); // 1 minute window
  if (requests.length >= 30) {
    return res.status(429).json({ error: "Too many requests" });
  }
  requests.push(now);
  global.searchRateLimit.set(ip, requests);

  const token = process.env.AQICN_TOKEN ? process.env.AQICN_TOKEN.trim() : "";
  if (!token) {
    return res.status(500).json({ error: "Missing AQICN_TOKEN" });
  }

  const url = `https://api.waqi.info/search/?token=${token}&keyword=${encodeURIComponent(keyword)}`;

  try {
    const response = await axios.get(url);

    if (response.data.status !== "ok") {
      throw new Error("AQICN search failed");
    }

    // Filter and deduplicate results
    const results = response.data.data || [];
    const uniqueCities = new Set();
    const suggestions = [];

    for (const item of results) {
      if (item.station && item.station.name) {
        // Basic clean up: get part before comma if it's a long station name like "Bandra, Mumbai, India" -> "Mumbai"
        // Actually, AQICN search returns full station strings. Let's just return the station name 
        // string up to the main city if possible, or just the whole string.
        let cityName = item.station.name;
        
        // Remove known trailing parts that might clutter it just to get clean city names
        cityName = cityName.replace(/Air Quality.*/i, "").trim();

        if (!uniqueCities.has(cityName) && suggestions.length < 5) {
          uniqueCities.add(cityName);
          suggestions.push({
            name: cityName,
            uid: item.uid,
            aqi: item.aqi
          });
        }
      }
    }

    res.status(200).json(suggestions);
  } catch (err) {
    console.error("Search API Error:", err.message);
    res.status(503).json({ error: "Search failed" });
  }
};
