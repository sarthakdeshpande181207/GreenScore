const homePage = document.querySelector(".home-page");
const resultPage = document.querySelector(".result-page");
const resultSection = document.getElementById("resultSection");

document.getElementById("checkBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value;

  if (!city) {
    alert("Please enter a city name");
    return;
  }

  // Mock data
  const aqi = 165;
  const greenScore = 42;

  let status = "Good";
  if (greenScore < 60) status = "Moderate";
  if (greenScore < 40) status = "Unhealthy";

  let accent = "#2ecc71";
  if (greenScore < 60) accent = "#f1c40f";
  if (greenScore < 40) accent = "#e74c3c";
  document.documentElement.style.setProperty("--accent", accent);

  resultSection.innerHTML = `
    <div class="card">
      <div class="left">
        <p>📍 ${city}</p>

        <div class="meter">
          <svg width="200" height="200">
            <circle cx="100" cy="100" r="88" stroke="rgba(255,255,255,0.15)" stroke-width="12" fill="none" />
            <circle cx="100" cy="100" r="88" stroke="var(--accent)" stroke-width="12" fill="none"
              stroke-dasharray="552" stroke-dashoffset="552" stroke-linecap="round" />
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
          <div class="action-card">
            <span class="icon">🏃‍♂️</span>
            <div>
              <strong>Avoid Outdoor Exercise</strong>
              <p>High pollution can strain your lungs</p>
            </div>
          </div>

          <div class="action-card">
            <span class="icon">😷</span>
            <div>
              <strong>Wear N95 Mask</strong>
              <p>Reduces inhalation of PM2.5 particles</p>
            </div>
          </div>

          <div class="action-card">
            <span class="icon">🔥</span>
            <div>
              <strong>Do Not Burn Waste</strong>
              <p>Prevents release of toxic gases</p>
            </div>
          </div>
        </div>
      </div>

    
      <div class="info-block">
         <h4>How GreenScore works</h4>
         <ul>
           <li>Fetches <strong>real-time air quality data</strong> using Google Air Quality API</li>
           <li>Converts AQI into a <strong>human-friendly GreenScore (0–100)</strong></li>
           <li>Uses <strong>Gemini AI</strong> to generate daily, context-aware health actions</li>
           <li>Designed to deliver <strong>clear insights without overwhelming users</strong></li>
          </ul>
      </div>

      <div class="map">
        Area overview<br />
        (Future Maps integration)
      </div>
    
    </div>
  `;

  setTimeout(() => {
    const circle = document.querySelector(".meter svg circle:nth-child(2)");
    circle.style.transition = "stroke-dashoffset 1s ease";
    circle.style.strokeDashoffset = 552 - (greenScore / 100) * 552;
  }, 100);

  homePage.classList.add("exit");
  resultPage.classList.add("active");
});

document.getElementById("backBtn").addEventListener("click", () => {
  homePage.classList.remove("exit");
  resultPage.classList.remove("active");
});

document.getElementById("cityInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") document.getElementById("checkBtn").click();
});