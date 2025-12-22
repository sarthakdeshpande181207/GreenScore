const homePage = document.querySelector(".home-page");
const resultPage = document.querySelector(".result-page");
const resultSection = document.getElementById("resultSection");

document.getElementById("checkBtn").addEventListener("click", async () => {
  const city = document.getElementById("cityInput").value;

  if (!city) {
    alert("Please enter a city name");
    return;
  }

  // TEMP AQI (until real AQI API is added)
  const aqi = 150;
  const greenScore = Math.max(0, 100 - Math.floor(aqi / 2));

  let status = "Good";
  if (greenScore < 60) status = "Moderate";
  if (greenScore < 40) status = "Unhealthy";

  let accent = "#2ecc71";
  if (greenScore < 60) accent = "#f1c40f";
  if (greenScore < 40) accent = "#e74c3c";
  document.documentElement.style.setProperty("--accent", accent);

  // FETCH actions from backend
  const response = await fetch(
    `http://localhost:5000/gemini-test?city=${city}&aqi=${aqi}`
  );
  const data = await response.json();

  console.log("Backend response:", data);

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
          <li>Uses air quality data to calculate GreenScore</li>
          <li>GreenScore ranges from 0 (worst) to 100 (best)</li>
          <li>Gemini AI generates health actions dynamically</li>
          <li>Fallback actions ensure reliability</li>
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
