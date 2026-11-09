# 🎙️ EchoGuide: Voice-Guided AI City Tour Guide

> **Transform any city into an interactive, open-air museum.** As you walk, cycle, or drive through a city, EchoGuide uses real-time GPS tracking to detect nearby landmarks, architectural marvels, and cultural spots, triggering contextual AI audio narration with custom guide personas and speech synthesis.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178c6.svg)](https://www.typescriptlang.org)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-Platform-4285F4.svg)](https://developers.google.com/maps)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-3.8%20Flash-8E75C2.svg)](https://ai.google.dev)

---

## 🧭 The Problem EchoGuide Solves

1. **Rigid, Expensive Guided Tours:** Traditional human-led group tours operate on strict schedules, cost substantial money, and force travelers into crowded groups following a fixed umbrella.
2. **Dry, Disconnected Map Pins:** Standard navigation and map apps display business hours, addresses, and star ratings, but completely lack evocative historical storytelling, architectural nuance, and local gossip.
3. **Hands-Busy Screen Fatigue:** Travelers constantly stare down at their phones reading articles or reviews rather than looking up at the historic facades, monuments, and arches right in front of them.

### How EchoGuide Fixes This
- **Eyes-Up, Hands-Free Exploration:** Geofenced proximity triggers automatically play natural spoken audio narrations when entering landmark zones (75 m walking, 150 m cycling, 300 m driving), preceded by a subtle acoustic museum chime.
- **Conversational Voice Q&A:** Have a question about a building? Tap the microphone to ask *"What's the history of this place?"* or *"Who designed this arch?"*. The AI responds conversationally with real-time map context and reads the answer aloud.
- **AI Route Optimization:** Choose a tour duration (e.g., 60 minutes) and interest focus, and EchoGuide calculates an optimized sequence that minimizes walking distance.

---

## ✨ Key Features

| Category | Features |
|----------|----------|
| 🛰️ **GPS & Movement** | Real-time `watchPosition()` tracking with compass heading arrow, speed, and accuracy circle. Interactive Walk Simulator (1x, 2x, 5x, 10x speeds) for testing indoors or previewing destinations. |
| 🔍 **Location Search & GPS Readout** | Instant location search bar supporting city names, landmarks, or global geocoding, with real-time display of place name and live GPS coordinates (`lat° N/S, lng° E/W`). |
| 🍔 **Tour Hub (Hamburger Menu)** | Sleek top-right slide-over menu organizing all tour controls: destination presets, travel modes, simulator controls, AI persona, audio settings, theme modes, and route planning. |
| 🗺️ **Google Maps Platform** | Modern `@vis.gl/react-google-maps` integration with `AdvancedMarkerElement`, custom SVG marker clustering via `@googlemaps/markerclusterer`, category pins, and tour path polylines. |
| 🧠 **AI Narration Engine** | Server-side Gemini 3.8 Flash (`@google/genai`) providing structured scripts: spoken narrative, era, architectural visual cues ("Look Up At"), surprising trivia, and local insider tips. |
| 🎭 **Tour Personas** | Choose your guide: 🏛️ **Lord Reginald** (Master Historian), 🍷 **Mia** (Local Insider), 🎭 **Elena** (Legend Storyteller), or 🎒 **Sam** (City Explorer). |
| 🔊 **Audio Experience** | Web Speech API text-to-speech with sentence-by-sentence karaoke highlighting, waveform equalizer animations, and synthesized dual-tone Web Audio acoustic chimes. |
| 🗣️ **Voice Q&A** | Web Speech API speech-to-text (`SpeechRecognition`) for spoken or typed questions, remembering conversation history and suggesting nearby stops. |
| 🌐 **Multi-Language** | Native multilingual generation and speech delivery in **English (🇬🇧)**, **Spanish (🇪🇸)**, **French (🇫🇷)**, **Italian (🇮🇹)**, **German (🇩🇪)**, and **Japanese (🇯🇵)**. |
| 💾 **Offline Cache & Storage** | LocalStorage caching (`POICache.ts`) for zero-latency replay and offline access, plus bookmarking Favorites (⭐) and History (📜). |

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Mapping:** `@vis.gl/react-google-maps`, `@googlemaps/markerclusterer`, Google Maps JavaScript API
- **AI Backend:** `@google/genai` (SDK `>= 3.0.0`) with `gemini-3.8-flash`
- **Speech & Audio:** Web Speech API (`SpeechSynthesis` & `SpeechRecognition`), Web Audio API (`AudioContext`)
- **Backend Entrypoints:** Full-stack Express server (`server.ts`) & Vite API dev middleware (`vite.config.ts`)

---

## 🔑 Required API Keys & Security

To run EchoGuide, you need two API keys. **Never commit raw keys to public GitHub repositories.**

### 1. Google Maps Platform API Key
- **Required API:** Maps JavaScript API
- **Where to obtain:** [Google Cloud Console Credentials](https://console.cloud.google.com/google/maps-apis/credentials)
- **Environment Variable:** `VITE_GOOGLE_MAPS_API_KEY`
- **Security Best Practices:**
  - In Google Cloud Console, edit your key and select **API restrictions** → restrict to **Maps JavaScript API**.
  - Select **Application restrictions** → **Websites (HTTP referrers)** and whitelist your domains:
    - `http://localhost:3000/*` (local development)
    - `https://your-domain.com/*` (production deployment)

### 2. Google Gemini AI API Key
- **Required Model:** `gemini-3.8-flash`
- **Where to obtain:** [Google AI Studio](https://aistudio.google.com/)
- **Environment Variable:** `GEMINI_API_KEY`
- **Security Best Practices:**
  - This key is **strictly server-side**. It is accessed by Node.js (`process.env.GEMINI_API_KEY`) and is never bundled into client-side code or exposed to browsers.

---

## 💻 Local Setup & Development

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/voice-city-tour-guide.git
cd voice-city-tour-guide
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root (you can copy `.env.example`):
```bash
cp .env.example .env
```

Open `.env` and fill in your keys:
```env
# Server-side Gemini API key (never expose to client)
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Client-side Google Maps Platform API key
VITE_GOOGLE_MAPS_API_KEY="your_actual_google_maps_api_key_here"

# Application URL and Port
PORT=3000
APP_URL="http://localhost:3000"
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> 💡 **Tip:** Browser geolocation (`navigator.geolocation`) requires a secure context (`https://`) on remote domains, but modern browsers explicitly permit `http://localhost` for local testing.

---

## 🚀 Deployment Guide

### Option A: Google Cloud Run (Recommended for GCP)

Google Cloud Run provides automatic scaling, HTTPS certificates, and secret management.

1. **Build and Run with Dockerfile:**
Create a `Dockerfile` in the root:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/server ./src/server
EXPOSE 3000
CMD ["npm", "run", "start"]
```

2. **Deploy via Google Cloud CLI:**
```bash
gcloud run deploy echoguide \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars VITE_GOOGLE_MAPS_API_KEY="your_maps_key" \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

---

### Option B: VPS (Ubuntu / Debian / Oracle Cloud / AWS EC2 / DigitalOcean)

1. **Install Node.js 20+ and PM2 on the server:**
```bash
sudo apt update && sudo apt install -y curl git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 tsx
```

2. **Clone and Build the App:**
```bash
git clone https://github.com/your-username/voice-city-tour-guide.git /var/www/echoguide
cd /var/www/echoguide
npm ci
nano .env # add your GEMINI_API_KEY and VITE_GOOGLE_MAPS_API_KEY
npm run build
```

3. **Start the Production Server with PM2:**
```bash
pm2 start server.ts --interpreter tsx --name echoguide
pm2 save
pm2 startup
```

4. **Configure Nginx Reverse Proxy with HTTPS:**
Edit `/etc/nginx/sites-available/echoguide`:
```nginx
server {
    server_name your-tour-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable site and obtain free SSL via Certbot (GPS requires HTTPS!):
```bash
sudo ln -s /etc/nginx/sites-available/echoguide /etc/nginx/sites-enabled/
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-tour-domain.com
sudo systemctl restart nginx
```

---

### Option C: Render / Railway

1. Push your repository to GitHub.
2. Link the repository in the **Render** or **Railway** dashboard.
3. Configure settings:
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm run start`
4. Add **Environment Variables** in the dashboard:
   - `GEMINI_API_KEY`
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `PORT=3000`

---

## 🧪 Testing Features Without Walking Outside

You do not need to physically walk around Rome or Kyoto to test EchoGuide:
1. **Interactive Route Simulator:**
   - Tap **Simulate Tour** in the header. The user marker will smoothly walk along the tour route.
   - Adjust the speed multiplier button to `2x`, `5x`, or `10x`.
   - As the marker enters the geofence radius of each landmark, you will hear the chime and audio narration will begin automatically.
2. **Click-to-Teleport:**
   - Click anywhere on the map to immediately move your location pin.
   - Or open the **Sights Drawer** and click **Walk Here** on any landmark.
3. **Voice Q&A:**
   - Click **Ask Guide**, tap the microphone icon, and say: *"What makes this place special?"*.
   - Gemini responds with context based on your current coordinates and nearby monuments.
4. **AI Route Optimizer:**
   - Tap **Optimize Tour** in the header, choose duration (e.g. 60m), and generate an optimized visiting order. Click **Apply & Tour This Route** to update the map polyline.

---

## ❓ Frequently Asked Questions (FAQ)

#### Q: Why is my browser not asking for GPS permissions?
Browser geolocation (`navigator.geolocation`) requires a secure HTTPS connection when accessed over the network. If accessing via an IP address or remote HTTP domain, browsers block geolocation by default. Use `http://localhost` for local testing or configure an SSL certificate (Let's Encrypt / Cloudflare) for production.

#### Q: How does speech synthesis work on mobile devices?
EchoGuide uses the browser's native `window.speechSynthesis`. On iOS Safari and Android Chrome, audio playback requires an initial user interaction (such as tapping "Simulate Tour" or "Enable Real GPS"). EchoGuide primes audio context on first tap to ensure subsequent proximity narrations play smoothly.

#### Q: Can I add my own city or neighborhood?
Yes! Simply open `src/data/cityPresets.ts` and add your city with landmark coordinates, era details, and walking route waypoints. You can also click the **AI Discovery** button anywhere on the map to have Gemini automatically detect and generate authentic local landmarks around your exact latitude and longitude.

---

## 📄 License & Attribution

- Application code is open-source under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).
- Google Maps Platform APIs are subject to the [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms).
