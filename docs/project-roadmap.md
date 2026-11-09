# 🎙️ Voice-Guided City Tour Guide — Project Blueprint & Implementation Status

## 1. Project Description

A mobile-friendly web app that uses the user's real-time GPS location to detect nearby landmarks and points of interest. As the user walks or drives through a city, the app automatically plays **AI-generated contextual narration** about what's around them — like a personalized, on-the-go museum guide. Users can ask voice questions ("What's the history of this building?") and get spoken answers, all layered over an interactive Google Map.

---

## 2. Core Features & Implementation Status

| Priority | Feature | Description | Status | Implementation Details |
|----------|---------|-------------|--------|------------------------|
| **P0** | Real-time GPS tracking | `navigator.geolocation.watchPosition()` with heading, speed, and accuracy | ✅ **Implemented** | `src/App.tsx` + `src/components/UserLocationMarker.tsx` with live heading compass & radar pulse |
| **P0** | POI detection & markers | Search and display nearby landmarks with marker clustering | ✅ **Implemented** | `src/components/ClusteredLandmarkMarkers.tsx` using `@googlemaps/markerclusterer` & `AdvancedMarkerElement` |
| **P0** | Auto-narration playback | AI generates & speaks contextual info when user enters proximity (75m walk, 150m cycle, 300m drive) | ✅ **Implemented** | `src/server/geminiTourService.ts` (`/api/tour/narrate`) + `audioNarrator.playArrivalChime()` + Web Speech API |
| **P1** | Voice Q&A | User asks voice or text questions; AI answers with location & landmark context | ✅ **Implemented** | `src/components/VoiceQAWidget.tsx` (`SpeechRecognition` STT + `/api/tour/ask` + TTS response) |
| **P1** | Tour categories | Filter by "All", "History", "Architecture", "Food & Markets", "Nature & Parks" | ✅ **Implemented** | `src/components/TourControlsHeader.tsx` & `src/components/LandmarksDrawer.tsx` |
| **P1** | Route suggestions | AI suggests an optimized walking/cycling/driving tour route connecting nearby POIs | ✅ **Implemented** | `src/components/RouteOptimizerModal.tsx` (`/api/tour/optimize-route`) + `TourRoutePolyline.tsx` |
| **P2** | Multi-language support | Spoken and textual narration in user's preferred language (EN, ES, FR, IT, DE, JA) | ✅ **Implemented** | Gemini prompt localization + localized Web Speech API voice selection |
| **P2** | Offline cache | Pre-load & cache narrations locally to avoid repeat API calls and allow offline replays | ✅ **Implemented** | `src/data/POICache.ts` via LocalStorage keying by POI, language, and persona |
| **P2** | Favorites & history | Save favorite spots (⭐) and review tour narration history with one-tap replay | ✅ **Implemented** | `src/data/TourStore.ts` + dedicated Favorites & History tabs in `LandmarksDrawer.tsx` |

---

## 3. Tech Stack

- **Frontend:** TypeScript + Vite + React 19 + Tailwind CSS v4
- **Maps:** Google Maps JavaScript API + `@vis.gl/react-google-maps` + `@googlemaps/markerclusterer` (`AdvancedMarkerElement`, `DEMO_MAP_ID`)
- **AI Backend:** `@google/genai` with `gemini-3.8-flash` running in server middleware (`server.ts` & `vite.config.ts`)
- **Speech Engine:** Web Speech API (`window.speechSynthesis` for TTS, `window.SpeechRecognition` / `webkitSpeechRecognition` for voice input)
- **Audio Effects:** Web Audio API (`AudioContext`) for synthesized two-tone acoustic museum arrival chime
- **Storage:** LocalStorage via `POICache.ts` (offline narration cache) & `TourStore.ts` (favorites & tour history)

---

## 4. Architecture Overview

```
User Device (Browser)
├── Geolocation Tracker → navigator.geolocation.watchPosition() & Route Simulator
├── Map Engine → @vis.gl/react-google-maps (APIProvider + Map + AdvancedMarker)
├── Marker Clusterer → @googlemaps/markerclusterer (Custom styled SVG count badges)
├── Proximity Geofencer → Haversine distance threshold (75m / 150m / 300m)
├── Voice Engine → Web Speech API (TTS with karaoke highlights + STT for Voice Q&A)
├── Acoustic Chime → Web Audio API (Dual-harmonic sine synthesizer)
├── Offline Cache & Store → POICache.ts & TourStore.ts (LocalStorage)
└── AI Server Proxy → Express / Vite middleware calling @google/genai (gemini-3.8-flash)
```

**Data Flow:**
1. **User Location**: `watchPosition()` or the Interactive Walk Simulator updates user coordinates.
2. **Proximity Trigger**: Geofencing checks distance to all active POIs (`getDistanceMeters`).
3. **Arrival Chime**: If within threshold (75m walk, 150m cycle, 300m drive), an acoustic chime rings.
4. **Cache & Generation**: `POICache` is checked. If cached, narration plays instantly. If not, `/api/tour/narrate` calls `gemini-3.8-flash`, returns structured narrative (story, era, trivia, look-at cue, activity), caches it, and adds to `TourStore` history.
5. **Speech Playback**: Web Speech API speaks the script in the selected language and guide persona, highlighting words in real-time.
6. **Voice Q&A**: User taps "Ask Guide" or speaks into the microphone (`VoiceQAWidget`), and Gemini answers with location-aware context.

---

## 5. Phase-Wise Development Plan & Status

### **Phase 1: Foundation (Weeks 1–2)** ✅ **COMPLETE**
- [x] Set up TypeScript + Vite + React + Tailwind CSS
- [x] Integrated Google Maps Platform using `@vis.gl/react-google-maps` and `DEMO_MAP_ID`
- [x] Implemented real-time GPS tracking with `watchPosition()`
- [x] Added custom User Location marker with animated radar beacon and heading arrow
- [x] Added Web Speech API TTS engine with pitch, rate, and speech controls
- [x] Built interactive walk simulation with 1x, 2x, 5x, and 10x speed multipliers

---

### **Phase 2: POI Integration (Weeks 3–4)** ✅ **COMPLETE**
- [x] Built curated city datasets for Rome, Paris, Kyoto, New York City, and London
- [x] Implemented dynamic nearby landmark discovery via AI endpoint `/api/tour/discover`
- [x] Integrated `@googlemaps/markerclusterer` with custom-rendered SVG cluster badges
- [x] Category-styled pins (Monuments, Architecture, Museums, Markets, Parks, Viewpoints)
- [x] Proximity geofence calculation with automatic travel mode radius adjustment
- [x] InfoWindows and slide-over Sights panel showing live distance and walking times

---

### **Phase 3: AI Narration (Weeks 5–6)** ✅ **COMPLETE**
- [x] Server-side `@google/genai` integration with `gemini-3.8-flash` and mandatory telemetry headers
- [x] Implemented **Prompt 1 (POI Narration Generator)**: engaging hook, historical facts, sensory visual cues ("Look Up At"), fun trivia, and local insider tips
- [x] Added 4 distinct Tour Guide personas:
  - 🏛️ **Lord Reginald (Master Historian)**
  - 🍷 **Mia (Local Insider)**
  - 🎭 **Elena (Legend Storyteller)**
  - 🎒 **Sam (City Explorer)**
- [x] Added narration depth selection: Quick Byte (~30s), Standard (~60-90s), Deep Dive (~2m)
- [x] Integrated `POICache.ts` for offline LocalStorage caching to eliminate duplicate API calls
- [x] Built audio player dock with real-time waveform equalizer and sentence karaoke highlighting

---

### **Phase 4: Voice Q&A & Interactivity (Weeks 7–8)** ✅ **COMPLETE**
- [x] Integrated Web Speech API `SpeechRecognition` for voice questions
- [x] Implemented **Prompt 2 (Voice Q&A Respondent)** in `/api/tour/ask`
- [x] Context-aware answers based on current coordinates, nearby landmarks, and active persona
- [x] Spoken audio playback of AI answers via TTS
- [x] Conversation memory and prompt suggestions ("What is special here?", "Who designed this?")
- [x] "Walk There" button to directly navigate to places mentioned in answers

---

### **Phase 5: Polish & Advanced Features (Weeks 9–10)** ✅ **COMPLETE**
- [x] Implemented category filter bar: History, Food & Markets, Architecture, Nature & Parks
- [x] Implemented **Prompt 3 (Tour Route Optimizer)** in `RouteOptimizerModal.tsx` & `/api/tour/optimize-route`
- [x] Implemented **Prompt 4 (Multi-Language Narration)**: localized text and TTS voices across English (🇬🇧), Spanish (🇪🇸), French (🇫🇷), Italian (🇮🇹), German (🇩🇪), and Japanese (🇯🇵)
- [x] Implemented Favorites (⭐) and History (📜) system with `TourStore.ts` and one-tap replay
- [x] Google Maps Platform Quota Defense implementation (Tier 1 `gm_authFailure` tap & Tier 2 `QuotaBanner`)
- [x] Glassmorphism dark-mode UI with fluid animations, mobile responsive layout, and accessibility

---

## 6. AI Prompt Templates in Production

The app integrates the four exact prompt templates from the roadmap in `src/server/geminiTourService.ts`:

### **Prompt 1: POI Narration Generator (`/api/tour/narrate`)**
```typescript
// Used in generateTourNarration()
// Formats engaging 60-90s spoken narration in user's target language
// Includes hook, 2-3 facts, conversational tone, suggested visual look-at,
// surprising trivia, and insider secret without markdown symbols.
```

### **Prompt 2: Voice Q&A Respondent (`/api/tour/ask`)**
```typescript
// Used in askTourGuide()
// Takes user_question, current lat/lng, nearby landmark list with distances,
// and answers conversationally under 100 words with spoken TTS audio.
```

### **Prompt 3: Tour Route Optimizer (`/api/tour/optimize-route`)**
```typescript
// Used in optimizeTourRoute()
// Takes duration (30-90m), travel mode (walk/cycle/drive), city, coordinates,
// and nearby POIs. Suggests an optimized visiting order with 1-sentence reasons
// and updates the active map polyline.
```

### **Prompt 4: Multi-Language Narration**
```typescript
// Integrated into generateTourNarration() & askTourGuide()
// Direct multilingual generation and localization across 6 languages:
// English, Español, Français, Italiano, Deutsch, 日本語.
```

---

## 7. Current Project Structure

```
.
├── docs/
│   └── project-roadmap.md          # Project blueprint & implementation tracking
├── src/
│   ├── main.tsx                    # React root + Tier 1 Google Maps quota listener
│   ├── App.tsx                     # Main application layout, state & audio routing
│   ├── index.css                   # Tailwind v4, glassmorphism & audio wave animations
│   ├── components/
│   │   ├── MapContainer.tsx        # @vis.gl/react-google-maps wrapper with DEMO_MAP_ID
│   │   ├── ClusteredLandmarkMarkers.tsx # MarkerClusterer with SVG cluster badges
│   │   ├── UserLocationMarker.tsx  # User marker with heading arrow & pulse ring
│   │   ├── TourRoutePolyline.tsx   # Planned route polyline & breadcrumb trail
│   │   ├── TourControlsHeader.tsx  # City switcher, GPS/Sim toggle, language & categories
│   │   ├── NarrationDock.tsx       # Bottom audio player dock with karaoke transcript
│   │   ├── LandmarksDrawer.tsx     # Sights list, Favorites (⭐) & History (📜)
│   │   ├── VoiceQAWidget.tsx       # SpeechRecognition voice & text Q&A modal
│   │   ├── RouteOptimizerModal.tsx # AI tour route suggestion & reordering
│   │   └── QuotaBanner.tsx         # Google Maps quota defense notification
│   ├── server/
│   │   └── geminiTourService.ts    # @google/genai server endpoints (Prompts 1, 2, 3, 4)
│   ├── data/
│   │   ├── cityPresets.ts          # Curated city packages (Rome, Paris, Kyoto, NYC, London)
│   │   ├── POICache.ts             # LocalStorage offline narration cache
│   │   └── TourStore.ts            # LocalStorage favorites & history store
│   ├── utils/
│   │   ├── audioNarrator.ts        # Web Speech API TTS + Web Audio chime synthesizer
│   │   └── geoUtils.ts             # Haversine distance, bearing & travel time calculations
│   └── types/
│       └── tour.ts                 # TypeScript interfaces for tour data structures
├── server.ts                       # Express production server for full-stack deployment
├── vite.config.ts                  # Vite config with server-side tour API middleware
└── package.json                    # Project dependencies & build scripts
```

---

## 8. Verification & Demo Flow

1. **City Selection**: Choose between Rome, Paris, Kyoto, New York, or London (or turn on Real GPS to tour your current city).
2. **Movement & Simulation**:
   - Turn on **Simulate Tour** (adjust speed to 1x, 2x, 5x, or 10x) or tap anywhere on the map to walk/teleport.
   - Or click **Enable Real GPS** to use your device's live browser geolocation.
3. **Proximity Narration**:
   - As you approach within the geofence (75m walking), an acoustic chime rings and the AI Tour Guide begins spoken narration.
   - Follow the sentence karaoke highlighting and audio visualizer in the bottom player dock.
   - Tap to expand for architectural look-up cues, surprising trivia, and insider secrets.
4. **Voice Q&A**:
   - Tap **Ask Guide**, press the microphone icon, and ask a question (e.g. *"What is the history of this place?"*).
   - Gemini answers with map-aware context and speaks the answer aloud.
5. **AI Route Optimizer**:
   - Tap **Optimize Tour**, select a duration (e.g. 60m), and generate a sequenced tour path that updates the map route.
6. **Multi-Language**:
   - Switch language (e.g. Spanish, French, Japanese) from the top bar to hear narrations and Q&A in that language.
7. **Favorites & History**:
   - Star any landmark to save it to Favorites, and review past narrations with one-tap replay in the Sights drawer.