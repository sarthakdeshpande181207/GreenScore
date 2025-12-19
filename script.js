document.getElementById("checkBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value;

  if (!city) {
    alert("Please enter a city name");
    return;
  }

  // MOCK DATA (replace later with API)
  const aqi = 132;
  const greenScore = 50;
  let status = "Good";
  if (greenScore < 60) status = "Moderate";
  if (greenScore < 40) status = "Poor";

  const suggestions = [
    "Avoid peak traffic hours",
    "Use public transport",
    "Wear a mask outdoors"
  ];

  // Color logic
  let color = "#2ecc71";
  if (greenScore < 60) color = "#f1c40f";
  if (greenScore < 40) color = "#e74c3c";
  document.documentElement.style.setProperty("--scoreColor", color);

  document.getElementById("resultSection").innerHTML = `
    <div class="card fade-in">
      <h3>📍 ${city}</h3>

      <div class="score">
        <span>AQI</span>
        <strong>${aqi}</strong>
      </div>

     <div class="greenscore">
       <span>GreenScore</span>
       <h1>${greenScore}</h1>
      <p class="status">${status}</p>
      </div>

      <h4>What you can do today 🌱</h4>
      <ul>
        ${suggestions.map(s => `<li>✔ ${s}</li>`).join("")}
      </ul>
    </div>
  `;

    document.getElementById("resultSection").scrollIntoView({
     behavior: "smooth"
  });

});
