# 🌱 GreenScore – AI Powered Air Quality Awareness Platform

GreenScore is a full-stack web application that displays **real-time Air Quality Index (AQI) data** for cities and presents insights to promote environmental awareness.

This project was developed as part of a TechSprint hackathon and is ready for live demonstration.

GOOGLE TECHNOLOGY USED : GOOGLE GEMINI AI
---

### 🌿 What is GreenScore?

GreenScore is a simple score (0-100) derived from the city’s AQI value that represents how environmentally safe the air is.  
A higher GreenScore indicates better air quality and healthier conditions, while a lower score highlights pollution risk.

## 🚀 Features

- 🌍 City-based AQI data using AQICN API
- 🟢 GreenScore calculation based on AQI values
- 🧠 3 Insightful suggestions based on air quality from Google Gemini AI
- 🗺️ City map preview (future integration)
- ⚠️ Clear backend dependency handling

---

## 🛠️ Tech Overview

- Frontend: HTML, CSS, JavaScript  
- Backend: Node.js (Express)
- AQI Data Source: AQICN API
- Actions Source: Gemini AI 
---

## 🌐 Live Demo & Backend Note

This project is deployed on **GitHub Pages** for UI preview:

🔗 Frontend (UI Preview):  
https://sarthakdeshpande181207.github.io/GreenScore/

⚠️ **Important:**  
GitHub Pages supports only static frontend files (HTML, CSS, JavaScript).  
The **Node.js backend** used to fetch real-time AQI data **does not run on GitHub Pages**.

---

## ▶️ Run Full Project (Live AQI Demo)

To experience the complete functionality with live AQI data:

1. Clone the repository by opening the terminal in desktop
   ```bash
   git clone https://github.com/sarthakdeshpande181207/GreenScore.git
  
2. Navigate to the backend folder
   ```bash
   cd backend

3. Install dependencies
   ```bash
   npm install

4. Start the backend server
   ```bash
   node server.js

ℹ️ Note for Evaluators / Judges

- The frontend depends on the backend to fetch live AQI data.
- If the backend is not running, the site may show a connection-related message.
- This behavior is intentional and indicates backend dependency.
- Starting the backend first ensures a fully working demo.

---

## 👥 Team

**Team Name:** Tech Strikers  
**Hackathon:** TechSprint AI Hack'25 GDG PCE
 
**Members:**
- Prasad Kokare (leader)
- Sarthak Deshpande
- Bhavesh Kumawa
- Prajwal Mote


