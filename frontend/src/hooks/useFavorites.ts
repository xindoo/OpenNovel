import { useState, useCallback, useEffect } from 'react';

export interface FavoriteItem {
  novelId: number;
  title: string;
  coverUrl: string;
  author: string;
  category: string;
  timestamp: number;
}

const STORAGE_KEY = 'opennovel-favorites';

function loadFavorites(): FavoriteItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: FavoriteItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const addFavorite = useCallback((item: Omit<FavoriteItem, 'timestamp'>) => {
    setFavorites(prev => {
      if (prev.some(f => f.novelId === item.novelId)) return prev;
      const entry: FavoriteItem = { ...item, timestamp: Date.now() };
      return [entry, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((novelId: number) => {
    setFavorites(prev => prev.filter(f => f.novelId !== novelId));
  }, []);

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'timestamp'>) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.novelId === item.novelId);
      if (exists) {
        return prev.filter(f => f.novelId !== item.novelId);
      }
      const entry: FavoriteItem = { ...item, timestamp: Date.now() };
      return [entry, ...prev];
    });
  }, []);

  const isFavorite = useCallback((novelId: number) => {
    return favorites.some(f => f.novelId === novelId);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
}
