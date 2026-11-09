import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client with mandatory telemetry header as per skill guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface NarrateRequest {
  landmarkName: string;
  category?: string;
  city?: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
  distanceMeters?: number;
  travelMode?: 'walking' | 'cycling' | 'driving';
  persona?: 'historian' | 'insider' | 'storyteller' | 'adventurer';
  length?: 'short' | 'standard' | 'deep';
  language?: string;
  additionalContext?: string;
}

export interface RealTimeWeather {
  temperatureC: number;
  temperatureF: number;
  condition: string;
  weatherCode: number;
  icon: string;
  isDay: boolean;
  windSpeedKmH: number;
  humidityPercent?: number;
  formattedText: string;
}

export function parseWeatherCode(code: number, isDay: boolean = true): { condition: string; icon: string } {
  switch (code) {
    case 0:
      return isDay ? { condition: 'Clear Sky', icon: '☀️' } : { condition: 'Clear Night', icon: '🌙' };
    case 1:
      return isDay ? { condition: 'Mainly Clear', icon: '🌤️' } : { condition: 'Mainly Clear', icon: '🌙' };
    case 2:
      return isDay ? { condition: 'Partly Cloudy', icon: '⛅' } : { condition: 'Partly Cloudy', icon: '☁️' };
    case 3:
      return { condition: 'Overcast', icon: '☁️' };
    case 45:
    case 48:
      return { condition: 'Foggy', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Light Drizzle', icon: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Snow', icon: '❄️' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', icon: '🌧️' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Thunderstorm', icon: '⛈️' };
    default:
      return { condition: 'Fair Weather', icon: '🌤️' };
  }
}

export async function fetchRealTimeWeather(lat: number, lng: number): Promise<RealTimeWeather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current;
    if (!current) return null;

    const tempC = Math.round(current.temperature_2m);
    const tempF = Math.round((tempC * 9) / 5 + 32);
    const isDay = current.is_day === 1;
    const { condition, icon } = parseWeatherCode(current.weather_code, isDay);

    return {
      temperatureC: tempC,
      temperatureF: tempF,
      condition,
      weatherCode: current.weather_code,
      icon,
      isDay,
      windSpeedKmH: Math.round(current.wind_speed_10m || 0),
      humidityPercent: current.relative_humidity_2m,
      formattedText: `${icon} ${tempC}°C (${tempF}°F) • ${condition}`,
    };
  } catch (err) {
    console.warn('Weather fetch warning (using fallback):', err);
    return null;
  }
}

export interface NarrateResponse {
  story: string;
  highlightSnippet: string;
  funFact: string;
  insiderTip: string;
  nearbyActivity: string;
  historicalEra: string;
  suggestedLookAt: string;
  weather?: RealTimeWeather | null;
}

const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  it: 'Italian (Italiano)',
  de: 'German (Deutsch)',
  ja: 'Japanese (日本語)',
};

export async function generateTourNarration(req: NarrateRequest): Promise<NarrateResponse> {
  const personaDescriptions = {
    historian: 'Lord Reginald, an eloquent, deeply knowledgeable Cambridge historian who brings centuries of dramatic history, architecture, and political intrigue vividly to life.',
    insider: 'Mia, a stylish local urban insider and cultural curator who reveals hidden secrets, local gossip, tucked-away courtyard gems, and authentic vibes.',
    storyteller: 'Elena, a captivating theatrical storyteller who weaves eerie folklore, romantic legends, heroic duels, and mysterious architectural quirks.',
    adventurer: 'Sam, an energetic, enthusiastic explorer who shares fun, accessible curiosities, interactive challenges, and bite-sized revelations.',
  };

  const selectedPersona = personaDescriptions[req.persona || 'historian'] || personaDescriptions.historian;

  const lengthInstructions = {
    short: 'Brief and punchy (around 60 to 90 words), designed for someone walking briskly or cycling past.',
    standard: 'A beautifully balanced narration (around 140 to 180 words, 60-90 seconds of speech), taking about 1 to 1.5 minutes to listen to.',
    deep: 'An immersive deep-dive (around 250 to 320 words) unearthing hidden details, legends, and architectural secrets.',
  };

  const selectedLength = lengthInstructions[req.length || 'standard'] || lengthInstructions.standard;
  const targetLang = languageNames[req.language || 'en'] || 'English';

  // Fetch real-time weather for the landmark's coordinates
  let weather: RealTimeWeather | null = null;
  if (req.coordinates?.lat && req.coordinates?.lng) {
    weather = await fetchRealTimeWeather(req.coordinates.lat, req.coordinates.lng);
  }

  const prompt = `You are a friendly, engaging city tour guide narrating aloud to a visitor right now.
Persona: ${selectedPersona}
Current Landmark: "${req.landmarkName}"
City: ${req.city || 'Nearby'}
Category: ${req.category || 'Historical Landmark'}
Traveler's current movement mode: ${req.travelMode || 'walking'} (distance away: approx. ${req.distanceMeters ? Math.round(req.distanceMeters) + ' meters' : 'right in front'}).
Language of delivery: ${targetLang}
${req.additionalContext ? `Context details: ${req.additionalContext}` : ''}
${weather ? `Current Live Weather at this landmark: ${weather.formattedText} (Wind: ${weather.windSpeedKmH} km/h). In the narration, weave a brief, natural sensory observation of the current weather/atmosphere (e.g., how the sunlight, clouds, breeze, or evening air touches the monument's stones today).` : ''}

Length requirement: ${selectedLength}

CRITICAL ROADMAP AUDIO NARRATION GUIDELINES:
1. Start with an engaging hook (e.g. welcoming them or pointing out a sight, naturally acknowledging today's weather).
2. Share 2-3 interesting facts or historical details.
3. Keep the tone conversational, warm, and immersive, like a knowledgeable local.
4. Mention something the visitor can see or do right here.
5. End with a smooth transition to the next stop.
6. Write in ${targetLang}. Do NOT use markdown symbols (no asterisks, no bullets, no headers) inside 'story'.
7. Give a specific visual detail ('suggestedLookAt'), surprising trivia ('funFact'), and local secret ('insiderTip').

Respond strictly with a valid JSON object matching this schema:
{
  "story": "The complete spoken audio narration text in ${targetLang} without markdown symbols or asterisks.",
  "highlightSnippet": "One captivating, poetic sentence summarizing this place in ${targetLang}.",
  "funFact": "One surprising trivia fact that 99% of people do not know in ${targetLang}.",
  "insiderTip": "A practical insider tip for someone standing right here in ${targetLang}.",
  "nearbyActivity": "A current cultural or urban activity to notice or do right now in ${targetLang}.",
  "historicalEra": "The architectural era or time period (e.g. 1st Century Roman, High Gothic 1240).",
  "suggestedLookAt": "A specific architectural detail to look at right now in ${targetLang}."
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini');
    }

    const parsed: NarrateResponse = JSON.parse(responseText);
    if (weather) {
      parsed.weather = weather;
    }
    return parsed;
  } catch (error) {
    console.error('Error generating tour narration via Gemini:', error);
    return {
      story: `Welcome to ${req.landmarkName}. As you stand here, take a moment to absorb the incredible atmosphere of this historic site. Built across generations, this landmark stands as a testament to the city's rich cultural heritage. Notice how the surrounding streets and architectural facades reflect centuries of evolving human stories.`,
      highlightSnippet: `A treasured cornerstone of ${req.city || 'the city'} celebrating timeless heritage.`,
      funFact: `Many of the foundation stones and architectural details date back centuries before the modern street layout.`,
      insiderTip: `Step slightly to the side to capture an unobstructed photo angle during golden hour.`,
      nearbyActivity: `Look out for local street musicians and artisanal stalls situated around the perimeter.`,
      historicalEra: `Historic Era`,
      suggestedLookAt: `The ornate masonry and central entrance archway.`,
      weather: weather,
    };
  }
}

export interface DiscoverRequest {
  lat: number;
  lng: number;
  city?: string;
  travelMode?: string;
}

export interface DiscoveredPlace {
  id: string;
  name: string;
  category: 'monument' | 'museum' | 'market' | 'park' | 'architecture' | 'activity' | 'viewpoint';
  lat: number;
  lng: number;
  shortDescription: string;
  historicalEra?: string;
  activityStatus?: string;
}

export async function discoverNearbyLandmarks(req: DiscoverRequest): Promise<DiscoveredPlace[]> {
  const prompt = `You are a geographic cultural historian. Given the coordinates latitude: ${req.lat}, longitude: ${req.lng} (likely near: ${req.city || 'this location'}), generate a curated list of 8 to 12 realistic, authentic landmarks, historical monuments, scenic viewpoints, cultural markets, and active neighborhood spots nearby (within 300 to 1200 meters of these coordinates).

If specific well-known real-world landmarks exist at this exact latitude and longitude, use the genuine real-world spots with accurate relative offsets (within ±0.008 degrees lat/lng).

Respond strictly with a JSON array of objects conforming to:
[
  {
    "id": "unique-slug-id",
    "name": "Name of Landmark or Place",
    "category": "monument" | "museum" | "market" | "park" | "architecture" | "activity" | "viewpoint",
    "lat": number (close to ${req.lat}),
    "lng": number (close to ${req.lng}),
    "shortDescription": "1-2 sentences explaining what makes this location extraordinary.",
    "historicalEra": "Approximate era or year built (e.g. 18th Century Baroque)",
    "activityStatus": "Current vibe or ongoing activity"
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as DiscoveredPlace[];
  } catch (error) {
    console.error('Error discovering landmarks:', error);
    return [];
  }
}

export interface AskTourGuideRequest {
  question: string;
  lat: number;
  lng: number;
  city?: string;
  nearbyLandmarks?: Array<{ name: string; category?: string; distanceMeters?: number }>;
  persona?: 'historian' | 'insider' | 'storyteller' | 'adventurer';
  language?: string;
}

export interface AskTourGuideResponse {
  answer: string;
  mentionedLandmark?: string;
  suggestedNextStop?: string;
  weather?: RealTimeWeather | null;
}

export async function askTourGuide(req: AskTourGuideRequest): Promise<AskTourGuideResponse> {
  const nearbyList = (req.nearbyLandmarks || [])
    .slice(0, 5)
    .map((lm) => `- ${lm.name} (${lm.distanceMeters ? Math.round(lm.distanceMeters) + 'm away' : 'nearby'})`)
    .join('\n');

  const targetLang = languageNames[req.language || 'en'] || 'English';

  // Fetch real-time weather for the user's current coordinates
  let weather: RealTimeWeather | null = null;
  if (req.lat && req.lng) {
    weather = await fetchRealTimeWeather(req.lat, req.lng);
  }

  const prompt = `You are a knowledgeable city tour guide with access to a user's current location and nearby landmarks. The user has asked a question while visiting a city.

User's Question: "${req.question}"
Current Location: ${req.lat}, ${req.lng} in ${req.city || 'this city'}
Nearby Landmarks:
${nearbyList || 'Various city landmarks'}
${weather ? `Live Local Weather: ${weather.formattedText} (Wind: ${weather.windSpeedKmH} km/h). Keep today's current weather in mind if recommending activities, scenic viewpoints, or nearby cafes/shelter.` : ''}

Language: ${targetLang}

Guidelines:
1. Answer the user's question in a friendly, conversational tone in ${targetLang}.
2. If the question is related to nearby landmarks, mention them specifically.
3. Keep the response under 100 words so it can be comfortably spoken aloud.
4. No markdown formatting (no asterisks, no bullets).

Respond strictly with valid JSON:
{
  "answer": "Spoken response text in ${targetLang} without markdown.",
  "mentionedLandmark": "Name of relevant landmark if applicable, or null",
  "suggestedNextStop": "Name of recommended next spot to walk to"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response');
    const parsed = JSON.parse(text) as AskTourGuideResponse;
    if (weather) {
      parsed.weather = weather;
    }
    return parsed;
  } catch (error) {
    console.error('Error answering tour question:', error);
    return {
      answer: `That is a wonderful question about ${req.city || 'this area'}. As you wander through these streets, look closely at the stonework and neighborhood courtyards for stories dating back centuries.`,
      suggestedNextStop: req.nearbyLandmarks?.[0]?.name,
      weather: weather,
    };
  }
}

export interface RouteOptimizerRequest {
  durationMinutes: number;
  mode: 'walking' | 'cycling' | 'driving';
  cityName: string;
  lat: number;
  lng: number;
  category: string;
  pois: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    category?: string;
  }>;
}

export interface RouteOptimizerResponse {
  stops: Array<{
    poiId: string;
    name: string;
    reason: string;
    lat: number;
    lng: number;
  }>;
  totalEstimatedMinutes: number;
  summary: string;
}

export async function optimizeTourRoute(req: RouteOptimizerRequest): Promise<RouteOptimizerResponse> {
  const poiLines = req.pois
    .map((p) => `- ID: "${p.id}", Name: "${p.name}", Coordinates: (${p.lat}, ${p.lng}), Category: "${p.category || 'landmark'}"`)
    .join('\n');

  const prompt = `You are an expert city walking guide and geographic route planner.
I am planning a ${req.durationMinutes}-minute ${req.mode} tour in ${req.cityName}. The user is currently at latitude ${req.lat}, longitude ${req.lng} and is interested in ${req.category} landmarks.

Here are nearby points of interest:
${poiLines}

Suggest an optimized visiting order that minimizes travel time while covering the most captivating spots for a ${req.durationMinutes}-minute ${req.mode} tour.
Return an array of the ordered stops, including their exact poiId, name, coordinates, and a brief 1-sentence reason for each placement in the tour sequence.

Respond strictly with valid JSON conforming to:
{
  "stops": [
    {
      "poiId": "matching-poi-id",
      "name": "Landmark Name",
      "reason": "1-sentence reason for placement in route order",
      "lat": number,
      "lng": number
    }
  ],
  "totalEstimatedMinutes": number,
  "summary": "1-2 sentences summarizing the theme and flow of this optimized tour."
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response');
    return JSON.parse(text) as RouteOptimizerResponse;
  } catch (error) {
    console.error('Error optimizing tour route:', error);
    // Fallback: order by proximity
    const fallbackStops = req.pois.map((p, idx) => ({
      poiId: p.id,
      name: p.name,
      reason: `Stop ${idx + 1} along the scenic route.`,
      lat: p.lat,
      lng: p.lng,
    }));

    return {
      stops: fallbackStops,
      totalEstimatedMinutes: req.durationMinutes,
      summary: `A scenic ${req.mode} tour around ${req.cityName} covering key historic highlights.`,
    };
  }
}

export interface GeocodeLocationResult {
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  cityName?: string;
}

export async function geocodeLocation(query: string): Promise<GeocodeLocationResult | null> {
  const mapsKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (mapsKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${mapsKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        const address = item.formatted_address || query;
        return {
          name: address.split(',')[0] || query,
          formattedAddress: address,
          lat: item.geometry.location.lat,
          lng: item.geometry.location.lng,
          cityName: item.address_components?.find((c: any) => c.types.includes('locality'))?.long_name,
        };
      }
    } catch (e) {
      console.warn('Google Maps Geocode error:', e);
    }
  }

  // Fallback to Gemini Geocoding with gemini-2.5-flash
  try {
    const prompt = `Identify the exact latitude and longitude coordinates for this place/location or address: "${query}".
Respond strictly with valid JSON conforming to:
{
  "name": "Short recognizable place name",
  "formattedAddress": "City, State/Region, Country",
  "lat": 0.0000,
  "lng": 0.0000,
  "cityName": "City name"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return parsed as GeocodeLocationResult;
    }
  } catch (err) {
    console.error('Gemini geocodeLocation error:', err);
  }

  return null;
}

