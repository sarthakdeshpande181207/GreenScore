# 🌱 GreenScore – AI-Powered Global Air Quality Platform

**🔗 [Live Demo](https://green-score-hazel.vercel.app/)**

GreenScore is a premium, full-stack web app designed to track **real-time Air Quality (AQI)** across the globe. It combines satellite data with **Google Gemini AI** to provide personalized health actions in a stunning modern interface.

---

## 🚀 Key Features

### 1. Air Quality Station Mapping
*   **Station-Based Pinning:** The map pin is accurately placed at the exact coordinates of the air quality monitoring station reporting the data, providing a true reflection of where the readings originate.
*   **Adaptive Display:** If a specific city doesn't have its own monitoring station, the app intelligently identifies the **nearest physical station** and maps its exact location.
*   **Global Search:** Type any city worldwide and the map will instantly fly to the relevant local monitoring station.

### 2. AI Health Insights
*   **Google Gemini 2.5 Integration:** Provides 3 custom health advisories based on the specific air quality of the searched city.
*   **Dynamic Logic:** Health suggestions update instantly based on changing pollution levels.

### 3. Interactive Data Dashboard
*   **AQI Trends:** Toggle between **Area** and **Bar** charts to see the air quality history over the last 15 days.
*   **GreenScore Meter:** A visual SVG dial that turns complex AQI data into a clear 0-100 score.
*   **Satellite & Street Views:** Switch map layers to see high-resolution satellite imagery or standard street maps.

### 4. Smart Security & Speed
*   **XSS Protection:** All search results and data are sanitized to keep the site secure.
*   **Rate Limiting:** Prevents API abuse to ensure the service stays fast for everyone.
*   **Autocomplete Search:** Fast, debounced search box that helps you find cities as you type.

---

## 🛠️ Tech Stack

*   **Intelligence:** Google Gemini AI API
*   **Data Source:** World Air Quality Index (AQICN)
*   **Mapping:** OpenStreetMap & Esri Satellite Layers
*   **Frontend:** HTML, CSS (Glassmorphism), JavaScript (Chart.js, Leaflet.js)
*   **Backend:** Node.js (Express)

---

## 🚀 Setup & Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/sarthakdeshpande181207/GreenScore.git
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:** Create a `.env` file:
    ```env
    AQICN_TOKEN=your_token_here
    GEMINI_API_KEY=your_key_here
    PORT=3000
    ```
4.  **Launch:**
    ```bash
    npm start
    ```

---

## 👥 Meet the Team: Tech Strikers
*Developed for TechSprint AI Hack'25 (GDG PCE)*

*   **Prasad Kokare** (Lead)
*   **Sarthak Deshpande**
*   **Bhavesh Kumawat**
*   **Prajwal Mote**


