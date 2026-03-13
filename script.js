const homePage = document.querySelector(".home-page");
const resultPage = document.querySelector(".result-page");
const resultSection = document.getElementById("resultSection");

// Default map center: Navi Mumbai
const DEFAULT_LAT = 19.0330;
const DEFAULT_LON = 73.0297;

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

// ═══════════════════════════════════════
//  HISTORY  (localStorage, per city)
// ═══════════════════════════════════════

function getHistoryKey(city) {
  return `greenscore_history_${city.toLowerCase().trim()}`;
}

function loadHistory(city) {
  try {
    const raw = localStorage.getItem(getHistoryKey(city));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(city, score) {
  const today = new Date().toISOString().slice(0, 10);
  let history = loadHistory(city);
  const idx = history.findIndex(e => e.date === today);
  if (idx >= 0) { history[idx].score = score; }
  else { history.push({ date: today, score, isEstimate: false }); }
  history.sort((a, b) => a.date.localeCompare(b.date));
  if (history.length > 30) history = history.slice(-30);
  try { localStorage.setItem(getHistoryKey(city), JSON.stringify(history)); } catch { }
  return history;
}

function buildChartData(city, currentScore) {
  let history = loadHistory(city);
  // Back-fill with estimated data if fewer than 15 real days
  if (history.length < 15) {
    const needDays = 15 - history.length;
    const oldest = history.length > 0 ? new Date(history[0].date) : new Date();
    const mock = [];
    let prev = history.length > 0 ? history[0].score : currentScore;
    for (let i = needDays; i >= 1; i--) {
      const d = new Date(oldest);
      d.setDate(oldest.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const delta = (Math.random() - 0.5) * 16;
      const score = Math.round(Math.max(0, Math.min(100, prev + delta)));
      mock.push({ date, score, isEstimate: true });
      prev = score;
    }
    history = [...mock, ...history];
  }
  return history.slice(-15);
}

// ═══════════════════════════════════════
//  CHART HELPERS
// ═══════════════════════════════════════

function scoreColor(s) {
  // Mapping GS to AQI equivalents based on 100 - (aqi/5)
  // GS 90-100 (AQI 0-50): Good
  // GS 80-89  (AQI 51-100): Moderate
  // GS 60-79  (AQI 101-200): Poor
  // GS 40-59  (AQI 201-300): Very Poor
  // GS 0-39   (AQI 301+): Severe

  if (s >= 90) return { color: "#2ecc71", label: "Good" };
  if (s >= 80) return { color: "#f1c40f", label: "Moderate" };
  if (s >= 60) return { color: "#e67e22", label: "Poor" };
  if (s >= 40) return { color: "#e74c3c", label: "Very Poor" };
  return { color: "#9b59b6", label: "Severe" };
}

function shortDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildDisplayData(cityHistory, days) {
  const map = {};
  cityHistory.forEach(e => { map[e.date] = e; });
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = map[key];
    result.push({
      date: shortDate(key),
      score: entry ? entry.score : null,
      isEstimate: entry ? !!entry.isEstimate : true,
    });
  }
  return result;
}

// ═══════════════════════════════════════
//  CANVAS CHART RENDERER
// ═══════════════════════════════════════

function drawChart(canvasId, displayData, chartType) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width, H = rect.height;
  const padL = 24, padR = 6, padT = 10, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const realScores = displayData.map(d => d.score).filter(s => s !== null);
  if (!realScores.length) return;

  const minS = Math.max(0, Math.min(...realScores) - 10);
  const maxS = Math.min(100, Math.max(...realScores) + 10);
  const range = maxS - minS || 1;
  const avg = Math.round(realScores.reduce((a, b) => a + b, 0) / realScores.length);
  const n = displayData.length;

  function xOf(i) { return padL + (i / (n - 1)) * chartW; }
  function yOf(s) { return padT + chartH - ((s - minS) / range) * chartH; }

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = padT + (g / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
  }

  // Avg reference line (dashed)
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, yOf(avg)); ctx.lineTo(padL + chartW, yOf(avg)); ctx.stroke();
  ctx.setLineDash([]);

  if (chartType === "area") {
    // Build connected segments skipping nulls
    const segments = [];
    let seg = [];
    displayData.forEach((d, i) => {
      if (d.score !== null) seg.push(i);
      else { if (seg.length) segments.push(seg); seg = []; }
    });
    if (seg.length) segments.push(seg);

    segments.forEach(seg => {
      const { color: lc } = scoreColor(displayData[seg[seg.length - 1]].score);
      const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
      grad.addColorStop(0, lc + "55");
      grad.addColorStop(1, lc + "00");

      ctx.beginPath();
      ctx.moveTo(xOf(seg[0]), yOf(displayData[seg[0]].score));
      for (let k = 1; k < seg.length; k++) {
        const x0 = xOf(seg[k - 1]), y0 = yOf(displayData[seg[k - 1]].score);
        const x1 = xOf(seg[k]), y1 = yOf(displayData[seg[k]].score);
        ctx.bezierCurveTo((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1);
      }
      ctx.lineTo(xOf(seg[seg.length - 1]), padT + chartH);
      ctx.lineTo(xOf(seg[0]), padT + chartH);
      ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();

      // Line Path
      ctx.beginPath();
      ctx.moveTo(xOf(seg[0]), yOf(displayData[seg[0]].score));
      for (let k = 1; k < seg.length; k++) {
        const idx0 = seg[k - 1];
        const idx1 = seg[k];
        const isEstimate = displayData[idx0].isEstimate || displayData[idx1].isEstimate;
        
        ctx.save();
        if (isEstimate) ctx.setLineDash([5, 5]); // Dashed for estimates
        
        ctx.beginPath();
        const x0 = xOf(idx0), y0 = yOf(displayData[idx0].score);
        const x1 = xOf(idx1), y1 = yOf(displayData[idx1].score);
        ctx.moveTo(x0, y0);
        ctx.bezierCurveTo((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1);
        
        ctx.strokeStyle = lc; 
        ctx.lineWidth = isEstimate ? 1.5 : 2.5; // Thinner for estimates
        ctx.stroke();
        ctx.restore();
      }
    });

    displayData.forEach((d, i) => {
      if (d.score === null) return;
      const { color: c } = scoreColor(d.score);
      ctx.beginPath();
      ctx.arc(xOf(i), yOf(d.score), 4, 0, Math.PI * 2);
      
      if (d.isEstimate) {
        // Est: Hollow circle / muted
        ctx.fillStyle = "rgba(5,8,20,0.9)";
        ctx.fill();
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Real: Solid circle
        ctx.fillStyle = c;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.8)"; 
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

  } else {
    // Bar chart
    const slotW = chartW / n;
    const barW = Math.max(6, slotW * 0.78);
    displayData.forEach((d, i) => {
      const x = padL + (i + 0.5) * slotW;
      if (d.score === null) {
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(x - barW / 2, padT + chartH - 4, barW, 4);
        return;
      }
      const { color: c } = scoreColor(d.score);
      const bH = Math.max(4, yOf(minS) - yOf(d.score));
      const bY = yOf(d.score);
      const r = Math.min(5, barW / 2);
      
      if (d.isEstimate) {
        // Hollow/Stripe look for bars? Let's just use opacity + border
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.strokeStyle = c;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(x - barW / 2, bY, barW, bH);
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = c;
      }

      ctx.beginPath();
      ctx.moveTo(x - barW / 2 + r, bY);
      ctx.lineTo(x + barW / 2 - r, bY);
      ctx.arcTo(x + barW / 2, bY, x + barW / 2, bY + r, r);
      ctx.lineTo(x + barW / 2, bY + bH);
      ctx.lineTo(x - barW / 2, bY + bH);
      ctx.arcTo(x - barW / 2, bY, x - barW / 2 + r, bY, r);
      ctx.closePath(); 
      if (!d.isEstimate) ctx.fill();
    });
  }

  // X-axis labels (every 3rd)
  ctx.fillStyle = "rgba(229,231,235,0.4)";
  ctx.font = "9px Poppins, sans-serif";
  ctx.textAlign = "center";
  const slotW2 = chartW / n;
  displayData.forEach((d, i) => {
    if (i % 3 === 0 || i === n - 1) {
      const x = chartType === "bar" ? padL + (i + 0.5) * slotW2 : xOf(i);
      ctx.fillText(d.date, x, padT + chartH + 18);
    }
  });

  // Y-axis labels
  ctx.textAlign = "right";
  for (let g = 0; g <= 4; g++) {
    const val = Math.round(minS + (1 - g / 4) * range);
    ctx.fillText(val, padL - 4, padT + (g / 4) * chartH + 3.5);
  }
}

// ═══════════════════════════════════════
//  CHART INIT (controls + tooltip)
// ═══════════════════════════════════════

function initChart(allData) {
  let chartType = "area";
  let range = "15d";

  function getDD() {
    return buildDisplayData(allData, range === "7d" ? 7 : 15);
  }

  function updateStats(dd) {
    const real = dd.filter(d => d.score !== null).map(d => d.score);
    const avg = real.length ? Math.round(real.reduce((a, b) => a + b, 0) / real.length) : null;
    const best = real.length ? Math.max(...real) : null;
    const worst = real.length ? Math.min(...real) : null;
    [["statAvg", avg], ["statBest", best], ["statWorst", worst]].forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (val === null) { el.textContent = "—"; el.style.color = "#334155"; return; }
      el.textContent = val;
      el.style.color = scoreColor(val).color;
    });
  }

  function redraw() {
    const dd = getDD();
    updateStats(dd);
    drawChart("scoreChart", dd, chartType);
    const real = dd.filter(d => d.score !== null);
    if (real.length) {
      const { color } = scoreColor(real[real.length - 1].score);
      const rd = document.getElementById("legendDotReal");
      const ed = document.getElementById("legendDotEst");
      if (rd) {
        rd.style.background = color;
        rd.style.border = "none";
      }
      if (ed) {
        ed.style.background = "transparent";
        ed.style.border = `2px dashed ${color}`;
      }
    }
  }

  // Toggle wiring
  document.querySelectorAll("#chartTypeToggle .ctoggle-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      chartType = btn.dataset.value;
      document.querySelectorAll("#chartTypeToggle .ctoggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active"); redraw();
    })
  );
  document.querySelectorAll("#chartRangeToggle .ctoggle-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      range = btn.dataset.value;
      document.querySelectorAll("#chartRangeToggle .ctoggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active"); redraw();
    })
  );

  // Hover tooltip
  const canvas = document.getElementById("scoreChart");
  const tooltip = document.getElementById("chartTooltip");
  if (canvas && tooltip) {
    canvas.addEventListener("mousemove", e => {
      const dd = getDD();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const padL = 24, padR = 6;
      const cW = rect.width - padL - padR;
      const n = dd.length;
      const slotW = cW / n;
      const idx = chartType === "bar"
        ? Math.floor((mx - padL) / slotW)
        : Math.round(((mx - padL) / cW) * (n - 1));

      if (idx < 0 || idx >= n) { tooltip.style.display = "none"; return; }
      const d = dd[idx];
      if (d.score === null) {
        tooltip.innerHTML = `<span class="tt-date">${d.date}</span><span class="tt-empty">No data yet</span>`;
      } else {
        const { color, label } = scoreColor(d.score);
        tooltip.innerHTML = `
          <span class="tt-date">${d.date}</span>
          <span class="tt-score" style="color:${color}">${d.score}</span>
          <span class="tt-meta">${label}</span>
          ${d.isEstimate ? '<span class="tt-estimate">⚠ Estimated data</span>' : ''}
        `;
      }
      const xPos = chartType === "bar" ? padL + (idx + 0.5) * slotW : padL + (idx / (n - 1)) * cW;
      let left = xPos + 10;
      if (left + 130 > rect.width) left = xPos - 140;
      tooltip.style.left = left + "px";
      tooltip.style.top = "8px";
      tooltip.style.display = "flex";
    });
    canvas.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
  }

  // Redraw on resize
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(redraw, 120); });

  redraw();
}

// ═══════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════

// ERROR MODAL LOGIC
function showErrorModal(type, data = {}) {
  const modal = document.getElementById("errorModal");
  const icon = document.getElementById("modalIcon");
  const title = document.getElementById("modalTitle");
  const msg = document.getElementById("modalMsg");

  if (type === "network") {
    icon.textContent = "🌐";
    title.textContent = "Connection Failed";
    msg.innerHTML = "Satellite connection failed. Please check your internet or try again later.";
  } else if (type === "429") {
    icon.textContent = "⏳";
    title.textContent = "System Busy";
    msg.innerHTML = "Satellite bandwidth limit reached. Please wait a minute and try again.";
  } else if (type === "notFound") {
    icon.textContent = "🔍";
    title.textContent = "City Not Found";
    msg.innerHTML = `We couldn't find <strong>"${data.city || 'the city'}"</strong>. Please check the spelling or try a major nearby city.`;
  } else {
    icon.textContent = "⚠️";
    title.textContent = "Error";
    msg.innerHTML = "Something went wrong. Please try again.";
  }

  modal.classList.add("active");
}

document.getElementById("closeModalBtn").addEventListener("click", () => {
  document.getElementById("errorModal").classList.remove("active");
});

// Click outside to close
document.getElementById("errorModal").addEventListener("click", (e) => {
  if (e.target.id === "errorModal") {
    document.getElementById("errorModal").classList.remove("active");
  }
});

// AUTOCOMPLETE LOGIC
const cityInput = document.getElementById("cityInput");
const suggestionsBox = document.getElementById("suggestionsBox");
let debounceTimeout;

cityInput.addEventListener("input", (e) => {
  const keyword = e.target.value.trim();
  delete cityInput.dataset.uid; // Clear UID when user manually types
  
  clearTimeout(debounceTimeout);
  
  if (keyword.length < 2) {
    suggestionsBox.classList.remove("active");
    suggestionsBox.innerHTML = "";
    return;
  }

  // Debounce API calls by 400ms to avoid spamming the backend
  debounceTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
      if (!res.ok) throw new Error("Search failed");
      
      const suggestions = await res.json();
      
      if (suggestions.length === 0) {
        suggestionsBox.classList.remove("active");
        suggestionsBox.innerHTML = "";
        return;
      }

      // Render suggestions
      suggestionsBox.innerHTML = suggestions.map(city => `
        <div class="suggestion-item" data-uid="${city.uid}">
          <i>🌍</i> <span>${city.name}</span>
        </div>
      `).join("");
      
      suggestionsBox.classList.add("active");

      // Handle clicking a suggestion
      const items = suggestionsBox.querySelectorAll(".suggestion-item");
      items.forEach(item => {
        item.addEventListener("click", () => {
          cityInput.value = item.querySelector("span").textContent;
          cityInput.dataset.uid = item.dataset.uid;
          suggestionsBox.classList.remove("active");
          document.getElementById("checkBtn").click(); // Auto-search
        });
      });

    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  }, 400);
});

// Hide autocomplete when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    suggestionsBox.classList.remove("active");
  }
});

document.getElementById("checkBtn").addEventListener("click", async () => {
  suggestionsBox.classList.remove("active"); // Hide on search click
  const cityInputEl = document.getElementById("cityInput");
  const city = cityInputEl.value;
  const uid = cityInputEl.dataset.uid;
  if (!city) { showErrorModal("custom", { msg: "Please enter a city name" }); return; }

  try {
    showLoader("Connecting to Satellite...");

    let url = `/api/aqi?city=${encodeURIComponent(city)}`;
    if (uid) url += `&uid=${uid}`;
    const response = await fetch(url);
    
    if (response.status === 429) {
      showErrorModal("429");
      return;
    }

    if (response.status === 503 || !navigator.onLine) {
      showErrorModal("network");
      return;
    }

    if (!response.ok) {
       throw new Error("Network response was not ok");
    }

    const data = await response.json();
    console.log("Backend response:", data);

    let aqiStr = data.aqi;
    // Handle cases where backend returns null or empty for valid cities that Nominatim found but AQICN didn't
    if (aqiStr == null || String(aqiStr).trim() === "-" || String(aqiStr).trim() === "") {
      showErrorModal("notFound", { city });
      return;
    }

    const aqi = parseInt(aqiStr, 10);
    if (isNaN(aqi)) {
      alert("AQI data is invalid for this city.");
      homePage.classList.remove("exit"); resultPage.classList.remove("active"); return;
    }

    let greenScore = aqi <= 500 ? 100 - (aqi / 5) : 0;
    greenScore = Math.max(0, Math.min(100, Math.round(greenScore)));

    // 🛰️ Global Precision: Prioritize coordinates from backend
    let lat, lon;
    if (typeof data.lat === "number" && typeof data.lon === "number") {
      lat = data.lat;
      lon = data.lon;
      console.log("Using backend coordinates:", lat, lon);
    } else {
      // Last resort fallback: Frontend geocoding (global)
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
          { headers: { "User-Agent": "GreenScoreApp/1.0" } }
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lon = parseFloat(geoData[0].lon);
          console.log("Using Nominatim fallback coords:", lat, lon);
        } else {
          lat = DEFAULT_LAT;
          lon = DEFAULT_LON;
        }
      } catch (e) {
        console.warn("Nominatim fallback failed:", e);
        lat = DEFAULT_LAT;
        lon = DEFAULT_LON;
      }
    }

    const { color: accent, label: status } = scoreColor(greenScore);

    document.documentElement.style.setProperty("--accent", accent);

    // Save & build chart data
    saveHistory(city, greenScore);
    const chartData = buildChartData(city, greenScore);

    function animateScore(target) {
      const el = document.getElementById("animatedScore");
      if (!el) return;
      let current = 0;
      const duration = 1500; // 1.5s
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Easing: easeOutExpo
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const val = Math.floor(ease * target);
        el.textContent = val;
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
      }
      requestAnimationFrame(update);
    }

    function escapeHTML(str) {
      if (!str) return "";
      return String(str).replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag]));
    }

    // Build fallback notice if needed
    let fallbackNotice = "";
    if (data.originalCity && i1(data.originalCity) !== i1(data.city)) {
      fallbackNotice = `
        <div class="fallback-notice">
          <span class="icon">⚠️</span>
          <p>Station offline in <strong>${escapeHTML(data.originalCity)}</strong>. Showing data from nearest station: <strong>${escapeHTML(data.city)}</strong>.</p>
        </div>
      `;
    } else if (data.source === "fallback") {
      fallbackNotice = `
        <div class="fallback-notice">
          <span class="icon">⚠️</span>
          <p>Regional sensors are currently offline. Showing estimated local air quality guidelines.</p>
        </div>
      `;
    }

    function i1(s) { return (s || "").toLowerCase().trim(); }

    // Render result
    resultSection.innerHTML = `
      ${fallbackNotice}
      <div class="card">
        <div class="left">
          <div class="score-block">
            <p style="font-size: 1.1rem; margin-bottom: 1rem;">📍 ${escapeHTML(city)}</p>
            <div class="meter">
              <svg width="200" height="200">
                <circle cx="100" cy="100" r="88" stroke="rgba(255,255,255,0.15)" stroke-width="12" fill="none" />
                <circle class="meter-fill" cx="100" cy="100" r="88" stroke="var(--accent)" stroke-width="12" fill="none"
                  stroke-dasharray="552" stroke-dashoffset="552" stroke-linecap="round" />
              </svg>
              <div class="meter-text">
                <span class="score" id="animatedScore">0</span>
                <span class="label">GreenScore</span>
              </div>
            </div>
            <div class="status" style="color:var(--accent); font-weight:600; font-size:1.1rem; margin-top:0.3rem;">${escapeHTML(status)}</div>
            <p style="margin-top:0.5rem; opacity: 0.8;">AQI: <strong>${escapeHTML(aqi)}</strong></p>
          </div>

          <h4>What you should do today</h4>
          <div class="actions">
            ${data.actions.map(action => `
              <div class="action-card">
                <span class="icon">💡</span>
                <p>${escapeHTML(action)}</p>
              </div>
            `).join("")}
          </div>
          <p class="status" style="margin-top:0.8rem; font-size: 0.75rem; opacity: 0.5;">Actions source: <strong>${escapeHTML(data.source)}</strong></p>
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
            <span class="map-title">📍 ${escapeHTML(city)}</span>
            <span class="map-aqi-badge" style="background:${accent}22;border-color:${accent};color:${accent};">AQI ${escapeHTML(aqi)}</span>
          </div>
          <div id="map"></div>
        </div>

        <div class="chart-block">
          <div class="chart-header">
            <div class="chart-title-area">
              <p class="chart-subtitle">History · AQICN</p>
              <h3 class="chart-main-title">GreenScore Trend</h3>
            </div>
            <div class="chart-controls">
              <div class="ctoggle-group" id="chartTypeToggle">
                <button class="ctoggle-btn active" data-value="area">〜</button>
                <button class="ctoggle-btn" data-value="bar">▐</button>
              </div>
              <div class="ctoggle-group" id="chartRangeToggle">
                <button class="ctoggle-btn" data-value="7d">7d</button>
                <button class="ctoggle-btn active" data-value="15d">15d</button>
              </div>
            </div>
          </div>
          <div class="chart-stats">
            <div class="stat-pill"><p class="stat-label">Avg</p><p class="stat-value" id="statAvg">—</p></div>
            <div class="stat-pill"><p class="stat-label">Best</p><p class="stat-value" id="statBest">—</p></div>
            <div class="stat-pill"><p class="stat-label">Worst</p><p class="stat-value" id="statWorst">—</p></div>
          </div>
          <div class="chart-canvas-wrap">
            <canvas id="scoreChart"></canvas>
            <div id="chartTooltip" class="chart-tooltip"></div>
          </div>
          <div class="chart-legend">
            <span class="legend-item"><span class="legend-dot" id="legendDotReal"></span>Real</span>
            <span class="legend-item"><span class="legend-dot" id="legendDotEst" style="opacity:0.4"></span>Estimated</span>
            <span class="chart-source">source: aqicn · local cache</span>
          </div>
        </div>
      </div>
    `;

    // Init map
    try {
      if (typeof L !== "undefined") {
        if (greenScoreMap) { greenScoreMap.remove(); greenScoreMap = null; }

        const streetLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19, attribution: "&copy; OpenStreetMap contributors",
        });
        const satelliteBase = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, attribution: "Tiles &copy; Esri" }
        );
        const satelliteLabels = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, attribution: "Labels &copy; Esri", pane: "overlayPane" }
        );
        const hybridLayer = L.layerGroup([satelliteBase, satelliteLabels]);

        greenScoreMap = L.map("map", { center: [lat, lon], zoom: 12, layers: [hybridLayer], zoomControl: true });

        L.control.layers({
          "<span class='layer-btn layer-satellite'>🛰️ Satellite</span>": hybridLayer,
          "<span class='layer-btn layer-street'>🗺️ Street</span>": streetLayer,
        }, null, { position: "bottomleft", collapsed: false }).addTo(greenScoreMap);

        const customIcon = L.divIcon({
          html: `<div style="width:36px;height:36px;background:${accent};border:3px solid rgba(255,255,255,0.9);border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 15px rgba(0,0,0,0.5);"></div>`,
          className: "", iconSize: [36, 36], iconAnchor: [18, 44], popupAnchor: [0, -38],
        });

        L.marker([lat, lon], { icon: customIcon }).addTo(greenScoreMap)
          .bindPopup(`<div style="font-family:Poppins,sans-serif;text-align:center;padding:4px 8px;min-width:120px;">
            <strong style="font-size:1rem;">📍 ${escapeHTML(city)}</strong><br/>
            <span style="color:${accent};font-weight:600;">AQI: ${escapeHTML(aqi)}</span><br/>
            <span style="font-size:0.75rem;opacity:0.7;">${escapeHTML(status)}</span>
          </div>`).openPopup();

        setTimeout(() => {
          const lc = document.querySelector(".leaflet-control-layers");
          if (lc) {
            lc.style.cssText = `background:rgba(10,15,30,0.92)!important;border:1px solid rgba(255,255,255,0.12)!important;border-radius:12px!important;backdrop-filter:blur(16px)!important;padding:10px 14px!important;box-shadow:0 8px 32px rgba(0,0,0,0.5)!important;color:#e5e7eb!important;font-family:Poppins,sans-serif!important;`;
            lc.querySelectorAll("input[type=radio]").forEach(i => { i.style.accentColor = accent; });
            lc.querySelectorAll("label").forEach(l => {
              l.style.cssText = `color:#e5e7eb!important;font-size:0.82rem!important;font-family:Poppins,sans-serif!important;cursor:pointer!important;display:flex!important;align-items:center!important;gap:6px!important;padding:4px 0!important;`;
            });
            const sep = lc.querySelector(".leaflet-control-layers-separator");
            if (sep) sep.style.borderColor = "rgba(255,255,255,0.1)";
          }
        }, 100);
      }
    } catch (mapErr) {
      console.error("Map error:", mapErr);
    }

    // Animate meter
    setTimeout(() => {
      const circle = document.querySelector(".meter svg circle.meter-fill");
      circle.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)";
      circle.style.strokeDashoffset = 552 - (greenScore / 100) * 552;
      animateScore(greenScore);
    }, 100);

    // Init chart
    setTimeout(() => { initChart(chartData); }, 150);

    // Map height slider
    setTimeout(() => {
      const slider = document.getElementById("mapHeightSlider");
      const valLabel = document.getElementById("mapSizeVal");
      const mapEl = document.getElementById("map");
      if (slider && mapEl) {
        slider.addEventListener("input", () => {
          const h = slider.value;
          mapEl.style.height = h + "px";
          valLabel.textContent = h + "px";
          if (greenScoreMap) greenScoreMap.invalidateSize();
        });
      }
    }, 200);


    homePage.classList.add("exit");
    resultPage.classList.add("active");

  } catch (err) {
    console.error(err);
    showErrorModal("network");
  } finally {
    hideLoader();
  }
});

document.getElementById("backBtn").addEventListener("click", () => {
  homePage.classList.remove("exit");
  resultPage.classList.remove("active");
});

document.getElementById("cityInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") document.getElementById("checkBtn").click();
});
