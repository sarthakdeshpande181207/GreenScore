const homePage = document.querySelector(".home-page");
const resultPage = document.querySelector(".result-page");
const resultSection = document.getElementById("resultSection");

// Default map center: Navi Mumbai
const DEFAULT_LAT = 19.0330;
const DEFAULT_LON = 73.0297;

// Keep reference to Leaflet map instance so we can reuse / destroy between searches
let greenScoreMap = null;

// Loading Overlay
const loadingOverlay = document.querySelector(".loading-overlay");
const loadingText = document.querySelector(".loading-text");

function showLoader(message = "Analyzing Air Quality...") {
  loadingText.textContent = message;
  loadingOverlay.classList.add("active");
}

function hideLoader() {
  loadingOverlay.classList.remove("active");
}

document.getElementById("checkBtn").addEventListener("click", async () => {
  const city = document.getElementById("cityInput").value;

  if (!city) {
    alert("Please enter a city name");
    return;
  }

  try {
    showLoader("Connecting to Satellite...");

    // 1️⃣ Fetch AQI + Gemini actions from backend
    const response = await fetch(
      `/api/aqi?city=${city}`
    );

    const data = await response.json();
    console.log("Backend response:", data);

    // 2️⃣ Safety check (allow 0 but not null/undefined)
    if (data.aqi == null) {
      alert("AQI data not available for this city.");
      return;
    }

    // 3️⃣ Extract AQI
    const aqi = data.aqi;

    // 4️⃣ Calculate GreenScore
    let greenScore ;
    if(aqi<=300){
      greenScore=100-(aqi/3);
    }
    else{
      greenScore=0;
    }
  
    // Clamp between 0 and 100
    greenScore = Math.max(0, Math.min(100, greenScore));

    // Round to integer
    greenScore = Math.round(greenScore);


    // 5️⃣ Decide status
    let status = "Good";
    if (greenScore < 60) status = "Moderate";
    if (greenScore < 40) status = "Unhealthy";

    // 6️⃣ Decide accent color
    let accent = "#2ecc71";
    if (greenScore < 60) accent = "#f1840fff";
    if (greenScore < 40) accent = "#e74c3c";

    document.documentElement.style.setProperty("--accent", accent);

    // 7️⃣ Render result page
    resultSection.innerHTML = `
      <div class="card">
        <div class="left">
          <p>📍 ${city}</p>

          <div class="meter">
            <svg width="200" height="200">
              <circle cx="100" cy="100" r="88"
                stroke="rgba(255,255,255,0.15)"
                stroke-width="12" fill="none" />
              <circle cx="100" cy="100" r="88"
                stroke="var(--accent)"
                stroke-width="12" fill="none"
                stroke-dasharray="552"
                stroke-dashoffset="552"
                stroke-linecap="round" />
            </svg>

            <div class="meter-text">
              <span class="score">${greenScore}</span>
              <span class="label">GreenScore</span>
            </div>
          </div>

          <div class="status">${status}</div>
          <p>AQI: <strong>${aqi}</strong></p>

          <h4>What you should do today</h4>

          <div class="actions">
            ${data.actions.map(action => `
              <div class="action-card">
                <span class="icon">💡</span>
                <p>${action}</p>
              </div>
            `).join("")}
          </div>

          <p class="status" style="margin-top:0.8rem;">
            Actions source: <strong>${data.source}</strong>
          </p>
        </div>

        <div class="info-block">
          <h4>How GreenScore works</h4>
          <ul>
            <li>Uses real-time AQI from monitoring stations</li>
            <li>Converts AQI into a GreenScore (0–100)</li>
            <li>Gemini AI generates daily health actions</li>
            <li>Fallback ensures reliability</li>
          </ul>
        </div>

        <div class="map">
          <div id="map"></div>
        </div>
      </div>
    `;

    // 8️⃣ Initialize map (Leaflet) – highlight user city
    try {
      if (typeof L !== "undefined") {
        // Prefer backend geocoded coordinates; fall back to Navi Mumbai
        const lat =
          typeof data.lat === "number" ? data.lat : DEFAULT_LAT;
        const lon =
          typeof data.lon === "number" ? data.lon : DEFAULT_LON;

        // Clean up previous map if it exists
        if (greenScoreMap) {
          greenScoreMap.remove();
          greenScoreMap = null;
        }

        // Zoomed-in city view
        greenScoreMap = L.map("map").setView([lat, lon], 14);

        // OpenStreetMap tiles (shows streets, shops, POIs, labels)
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(greenScoreMap);

        // City name marker
        L.marker([lat, lon])
          .addTo(greenScoreMap)
          .bindPopup(city)
          .openPopup();
      }
    } catch (mapErr) {
      console.error("Map error:", mapErr);
      const mapEl = document.querySelector(".map");
      if (mapEl) {
        mapEl.textContent = "Map error. Open browser console for details.";
      }
    }

    // 9️⃣ Animate meter
    setTimeout(() => {
      const circle = document.querySelector(
        ".meter svg circle:nth-child(2)"
      );
      circle.style.transition = "stroke-dashoffset 1s ease";
      circle.style.strokeDashoffset =
        552 - (greenScore / 100) * 552;
    }, 100);

    // 🔟 Switch page
    homePage.classList.add("exit");
    resultPage.classList.add("active");

  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  } finally {
    hideLoader();
  }
});

// 🔙 Back button
document.getElementById("backBtn").addEventListener("click", () => {
  homePage.classList.remove("exit");
  resultPage.classList.remove("active");
});

// ⏎ Enter key support
document.getElementById("cityInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("checkBtn").click();
  }
});
