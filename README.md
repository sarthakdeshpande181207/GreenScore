# 🌱 GreenScore – AI Powered Air Quality Awareness Platform

GreenScore is a full-stack web application that displays **real-time Air Quality Index (AQI) data** for cities and presents insights to promote environmental awareness.

This project was developed as part of a TechSprint hackathon and is ready for live demonstration.

GOOGLE TECHNOLOGY USED : GOOGLE GEMINI AI
---

### 🌿 What is GreenScore?

GreenScore is a simple score derived from the city’s AQI value that represents how environmentally safe the air is.  
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

## ▶️ How to Run (Demo Mode)

### Step 1: Start Backend

```bash
node server.js 

```
- The backend runs on http://localhost:5000

### Step 2: Open the Frontend

- Open index.html in a browser (or via Live Server).
- The site will automatically connect to the backend and display AQI results.


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
- Bhavesh Kumawat
- Prajwal Mote


