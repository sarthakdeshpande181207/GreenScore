const express = require("express");
const process = require("process");
const path = require("path");
const apiHandler = require("./api/aqi"); // Import the Vercel handler

require("dotenv").config(); // Load environment variables

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Use the Vercel handler for the API route
app.get("/api/aqi", apiHandler);
app.get("/api/search", require("./api/search"));

function startServer(port, attemptedFallback = false) {
  const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && !attemptedFallback) {
      const fallbackPort = port + 1;
      console.error(
        `Port ${port} is already in use. Trying fallback port ${fallbackPort}...`
      );
      startServer(fallbackPort, true);
    } else {
      console.error("Server startup error:", err);
    }
  });
}

startServer(DEFAULT_PORT);
