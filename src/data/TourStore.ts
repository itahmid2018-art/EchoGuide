// Favorites & History Store with LocalStorage persistence
// Implements P2 Favorites & history from project-roadmap.md

const FAVORITES_KEY = 'echoguide_favorites_v1';
const HISTORY_KEY = 'echoguide_history_v1';

export interface HistoryItem {
  poiId: string;
  poiName: string;
  cityName: string;
  category: string;
  narrationSnippet: string;
  timestamp: number;
}

export const TourStore = {
  // Favorites
  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isFavorite(poiId: string): boolean {
    const list = TourStore.getFavorites();
    return list.includes(poiId);
  },

  toggleFavorite(poiId: string): boolean {
    const list = TourStore.getFavorites();
    const index = list.indexOf(poiId);
    let updated: string[];
    let isNowFav = false;

    if (index >= 0) {
      updated = list.filter((id) => id !== poiId);
      isNowFav = false;
    } else {
      updated = [...list, poiId];
      isNowFav = true;
    }

    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save favorites:', e);
    }
    return isNowFav;
  },

  // Tour History
  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addHistory(item: HistoryItem): void {
    const list = TourStore.getHistory();
    // Prepend and filter duplicates
    const filtered = list.filter((h) => h.poiId !== item.poiId);
    const updated = [item, ...filtered].slice(0, 50); // Keep last 50 visited spots

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.warn('Failed to clear history:', e);
    }
  },
};
