// LocalStorage cache for AI-generated POI narrations and translations
// Implements P2 Offline Cache requirement from project-roadmap.md

import { RealTimeWeather } from '../types/tour';

const CACHE_PREFIX = 'echoguide_narration_v1_';

export interface CachedNarration {
  poiId: string;
  language: string;
  persona: string;
  narrationText: string;
  highlightSnippet?: string;
  funFact?: string;
  insiderTip?: string;
  nearbyActivity?: string;
  historicalEra?: string;
  suggestedLookAt?: string;
  weather?: RealTimeWeather;
  timestamp: number;
}

export const POICache = {
  get(poiId: string, language: string = 'en', persona: string = 'historian'): CachedNarration | null {
    try {
      const key = `${CACHE_PREFIX}${poiId}_${language}_${persona}`;
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as CachedNarration;
    } catch (e) {
      console.warn('Failed to read from POICache:', e);
      return null;
    }
  },

  set(entry: CachedNarration): void {
    try {
      const key = `${CACHE_PREFIX}${entry.poiId}_${entry.language}_${entry.persona}`;
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.warn('Failed to write to POICache:', e);
    }
  },

  has(poiId: string, language: string = 'en', persona: string = 'historian'): boolean {
    return POICache.get(poiId, language, persona) !== null;
  },

  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.warn('Failed to clear POICache:', e);
    }
  },
};
