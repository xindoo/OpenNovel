import { useState, useCallback, useEffect } from 'react';

export interface RecentRead {
  novelId: number;
  title: string;
  coverUrl: string;
  chapterId: number;
  chapterNumber: number;
  chapterTitle: string;
  totalChapters: number;
  timestamp: number;
}

const STORAGE_KEY = 'opennovel-recent-reads';
const MAX_RECENT = 50;

function loadRecentReads(): RecentRead[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRecentReads(reads: RecentRead[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reads));
}

export function useRecentReads() {
  const [recentReads, setRecentReads] = useState<RecentRead[]>(loadRecentReads);

  useEffect(() => {
    saveRecentReads(recentReads);
  }, [recentReads]);

  const addRecentRead = useCallback((read: Omit<RecentRead, 'timestamp'>) => {
    setRecentReads(prev => {
      // Remove existing entry for same novel
      const filtered = prev.filter(r => r.novelId !== read.novelId);
      const entry: RecentRead = { ...read, timestamp: Date.now() };
      return [entry, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  const removeRecentRead = useCallback((novelId: number) => {
    setRecentReads(prev => prev.filter(r => r.novelId !== novelId));
  }, []);

  const clearRecentReads = useCallback(() => {
    setRecentReads([]);
  }, []);

  const getProgress = useCallback((novelId: number) => {
    const entry = recentReads.find(r => r.novelId === novelId);
    if (!entry) return 0;
    if (entry.totalChapters === 0) return 0;
    return Math.round((entry.chapterNumber / entry.totalChapters) * 100);
  }, [recentReads]);

  const getLastRead = useCallback((novelId: number) => {
    return recentReads.find(r => r.novelId === novelId) || null;
  }, [recentReads]);

  return {
    recentReads,
    addRecentRead,
    removeRecentRead,
    clearRecentReads,
    getProgress,
    getLastRead,
  };
}
