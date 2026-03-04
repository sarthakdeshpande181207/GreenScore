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
    const response = await fetch(`/api/aqi?city=${city}`);
    const data = await response.json();
    console.log("Backend response:", data);

    // 2️⃣ Safety check
    let aqiStr = data.aqi;
    if (aqiStr == null || String(aqiStr).trim() === "-" || String(aqiStr).trim() === "") {
      alert("Realtime AQI data not yet available for this city.");
      homePage.classList.remove("exit");
      resultPage.classList.remove("active");
      return;
    }

    // 3️⃣ Extract AQI as integer
    const aqi = parseInt(aqiStr, 10);
    if (isNaN(aqi)) {
      alert("AQI data is invalid for this city.");
      homePage.classList.remove("exit");
      resultPage.classList.remove("active");
      return;
    }

    // 4️⃣ Calculate GreenScore
    let greenScore;
    if (aqi <= 300) {
      greenScore = 100 - (aqi / 3);
    } else {
      greenScore = 0;
    }
    greenScore = Math.max(0, Math.min(100, Math.round(greenScore)));

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
          <div class="map-header">
            <span class="map-title">📍 ${city}</span>
            <span class="map-aqi-badge" style="background: ${accent}22; border-color: ${accent}; color: ${accent};">AQI ${aqi}</span>
          </div>
          <div id="map"></div>
        </div>
      </div>
    `;

    // 8️⃣ Initialize map (Leaflet)
    try {
      if (typeof L !== "undefined") {
        const lat = typeof data.lat === "number" ? data.lat : DEFAULT_LAT;
        const lon = typeof data.lon === "number" ? data.lon : DEFAULT_LON;

        if (greenScoreMap) {
          greenScoreMap.remove();
          greenScoreMap = null;
        }

        // Street layer
        const streetLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        });

        // Satellite base (imagery only, no labels)
        const satelliteBase = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 19,
          attribution: "Tiles &copy; Esri",
        });

        // Labels overlay for satellite (roads, place names, borders)
        const satelliteLabels = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 19,
          attribution: "Labels &copy; Esri",
          pane: "overlayPane",
        });

        // Combine into a LayerGroup so they toggle together
        const hybridLayer = L.layerGroup([satelliteBase, satelliteLabels]);

        // Init map with hybrid satellite as default
        greenScoreMap = L.map("map", {
          center: [lat, lon],
          zoom: 14,
          layers: [hybridLayer],
          zoomControl: true,
        });

        // Custom styled layer control
        const baseMaps = {
          "<span class='layer-btn layer-satellite'>🛰️ Satellite</span>": hybridLayer,
          "<span class='layer-btn layer-street'>🗺️ Street</span>": streetLayer,
        };

        L.control.layers(baseMaps, null, {
          position: "bottomright",
          collapsed: false,
        }).addTo(greenScoreMap);

        // Custom marker with accent color
        const markerHtml = `
          <div style="
            width: 36px; height: 36px;
            background: ${accent};
            border: 3px solid rgba(255,255,255,0.9);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          "></div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -38],
        });

        L.marker([lat, lon], { icon: customIcon })
          .addTo(greenScoreMap)
          .bindPopup(`
            <div style="
              font-family: Poppins, sans-serif;
              text-align: center;
              padding: 4px 8px;
              min-width: 120px;
            ">
              <strong style="font-size:1rem;">📍 ${city}</strong><br/>
              <span style="color:${accent}; font-weight:600;">AQI: ${aqi}</span><br/>
              <span style="font-size:0.75rem; opacity:0.7;">${status}</span>
            </div>
          `)
          .openPopup();

        // Style the layer control after it's added to DOM
        setTimeout(() => {
          const layerControl = document.querySelector(".leaflet-control-layers");
          if (layerControl) {
            layerControl.style.cssText = `
              background: rgba(10, 15, 30, 0.92) !important;
              border: 1px solid rgba(255,255,255,0.12) !important;
              border-radius: 12px !important;
              backdrop-filter: blur(16px) !important;
              padding: 10px 14px !important;
              box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
              color: #e5e7eb !important;
              font-family: Poppins, sans-serif !important;
            `;

            // Style the radio inputs
            const inputs = layerControl.querySelectorAll("input[type=radio]");
            inputs.forEach(input => {
              input.style.accentColor = accent;
            });

            // Style label spans
            const labels = layerControl.querySelectorAll("label");
            labels.forEach(label => {
              label.style.cssText = `
                color: #e5e7eb !important;
                font-size: 0.82rem !important;
                font-family: Poppins, sans-serif !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                padding: 4px 0 !important;
              `;
            });

            // Style separator
            const separator = layerControl.querySelector(".leaflet-control-layers-separator");
            if (separator) separator.style.borderColor = "rgba(255,255,255,0.1)";
          }
        }, 100);
      }
    } catch (mapErr) {
      console.error("Map error:", mapErr);
      const mapEl = document.querySelector(".map");
      if (mapEl) mapEl.textContent = "Map error. Open browser console for details.";
    }

    // 9️⃣ Animate meter
    setTimeout(() => {
      const circle = document.querySelector(".meter svg circle:nth-child(2)");
      circle.style.transition = "stroke-dashoffset 1s ease";
      circle.style.strokeDashoffset = 552 - (greenScore / 100) * 552;
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
  if (e.key === "Enter") document.getElementById("checkBtn").click();
});
