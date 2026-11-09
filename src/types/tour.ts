export type LandmarkCategory =
  | 'monument'
  | 'museum'
  | 'architecture'
  | 'market'
  | 'park'
  | 'activity'
  | 'viewpoint';

export type TourCategoryFilter =
  | 'all'
  | 'history'
  | 'food'
  | 'architecture'
  | 'nature'
  | 'museum';

export type TravelMode = 'walking' | 'cycling' | 'driving';

export type GuidePersona = 'historian' | 'insider' | 'storyteller' | 'adventurer';

export type NarrationLength = 'short' | 'standard' | 'deep';

export type TourLanguage = 'en' | 'es' | 'fr' | 'it' | 'de' | 'ja';

export interface LanguageOption {
  code: TourLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export interface Landmark {
  id: string;
  name: string;
  category: LandmarkCategory;
  lat: number;
  lng: number;
  shortDescription: string;
  historicalEra?: string;
  funFact?: string;
  insiderTip?: string;
  suggestedLookAt?: string;
  activityNow?: string;
  audioNarration?: string;
  address?: string;
  visited?: boolean;
}

export interface CityPreset {
  id: string;
  name: string;
  country: string;
  center: { lat: number; lng: number };
  zoom: number;
  tagline: string;
  landmarks: Landmark[];
  walkingRoute: { lat: number; lng: number }[];
}

export interface UserPosition {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number; // m/s
  accuracy?: number; // meters
  timestamp: number;
}

export interface RealTimeWeather {
  temperatureC: number;
  temperatureF: number;
  condition: string;
  icon: string;
  formattedText: string;
  windSpeedKmH?: number;
  humidityPercent?: number;
  isDay?: boolean;
}

export interface ActiveNarration {
  landmark: Landmark;
  story: string;
  highlightSnippet?: string;
  funFact?: string;
  insiderTip?: string;
  nearbyActivity?: string;
  historicalEra?: string;
  suggestedLookAt?: string;
  persona: GuidePersona;
  length: NarrationLength;
  language?: TourLanguage;
  weather?: RealTimeWeather;
}

export interface TourSettings {
  autoNarration: boolean;
  soundChimes: boolean;
  travelMode: TravelMode;
  persona: GuidePersona;
  narrationLength: NarrationLength;
  language: TourLanguage;
  speechRate: number;
  speechPitch: number;
  speechVoiceName: string;
}

export interface OptimizedRouteStop {
  poiId: string;
  name: string;
  reason: string;
  lat: number;
  lng: number;
}

export interface OptimizedRoutePlan {
  stops: OptimizedRouteStop[];
  totalEstimatedMinutes: number;
  summary: string;
}
