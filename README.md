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

🔗 Full demo:

https://green-score-hazel.vercel.app/

NOTE !! : THE RESULT PAGE WONT BE SHOWN IF FREE TIER LIMITS OF API ARE EXHAUSTED 

⚠️ **Important:**  
GitHub Pages supports only static frontend files (HTML, CSS, JavaScript).  
The **Node.js backend** used to fetch real-time AQI data **does not run on GitHub Pages**.

---

## ⚠️ Note for Evaluators

The GreenScore application is fully deployed on **Vercel** and can be accessed through the live demo link.

- The **frontend and backend** are hosted together using Vercel serverless functions.
- Real-time AQI data is fetched securely, and **AI-generated insights are powered by Google Gemini AI**.
- API keys are managed using environment variables to ensure security.

If a specific city does not have a dedicated AQI monitoring station (e.g., Panvel), the system intelligently uses data from the **nearest major city** to provide meaningful and reliable insights.

The deployed version represents the **complete and intended functionality** of the solution.
---

## 👥 Team

**Team Name:** Tech Strikers  
**Hackathon:** TechSprint AI Hack'25 GDG PCE
 
**Members:**
- Prasad Kokare (leader)
- Sarthak Deshpande
- Bhavesh Kumawat
- Prajwal Mote


