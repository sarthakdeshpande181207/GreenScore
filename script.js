document.getElementById("checkBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value;

  if (!city) {
    alert("Please enter a city name");
    return;
  }

  // Mock data
  const aqi = 132;
  const greenScore = 50;
  const suggestions = [
    "Avoid peak traffic hours",
    "Use public transport",
    "Wear a mask outdoors"
  ];

  document.getElementById("resultSection").innerHTML = `
    <h3>📍 ${city}</h3>
    <p><strong>AQI:</strong> ${aqi}</p>
    <p><strong>GreenScore:</strong> ${greenScore}</p>
    <ul>
      ${suggestions.map(s => `<li>${s}</li>`).join("")}
    </ul>
  `;
});
