const homePage = document.querySelector(".home-page");
const resultPage = document.querySelector(".result-page");
const resultSection = document.getElementById("resultSection");

document.getElementById("checkBtn").addEventListener("click", async () => {
  const city = document.getElementById("cityInput").value;

  if (!city) {
    alert("Please enter a city name");
    return;
  }

  try {
    // 1️⃣ Fetch AQI + Gemini actions from backend
    const response = await fetch(
      `http://localhost:5000/aqi?city=${encodeURIComponent(city)}`
    );

    const data = await response.json();
    console.log("Backend response:", data);

    // 2️⃣ Safety check
    if (!data.aqi) {
      alert("AQI data not available for this city.");
      return;
    }

    // 3️⃣ Extract AQI
    const aqi = data.aqi;

    // 4️⃣ Calculate GreenScore
    let greenScore;

    if (aqi <= 50) {
     greenScore = 95;
    } else if (aqi <= 100) {
     greenScore = 80;
    } else if (aqi <= 200) {
     greenScore = 55;
    } else if (aqi <= 300) {
    greenScore = 30;
    } else if (aqi <= 400) {
    greenScore = 15;
    } else {
     greenScore = 5;
    }


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
          Area overview<br />
          (Future Maps integration)
        </div>
      </div>
    `;

    // 8️⃣ Animate meter
    setTimeout(() => {
      const circle = document.querySelector(
        ".meter svg circle:nth-child(2)"
      );
      circle.style.transition = "stroke-dashoffset 1s ease";
      circle.style.strokeDashoffset =
        552 - (greenScore / 100) * 552;
    }, 100);

    // 9️⃣ Switch page
    homePage.classList.add("exit");
    resultPage.classList.add("active");

  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
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
