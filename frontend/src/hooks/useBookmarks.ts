import { useState, useCallback, useEffect } from 'react';

export interface BookmarkItem {
  novelId: number;
  chapterId: number;
  chapterNumber: number;
  chapterTitle: string;
  scrollPercent: number;
  surroundingText: string;
  timestamp: number;
}

const STORAGE_KEY = 'opennovel-bookmarks';
const MAX_BOOKMARKS = 200;

function loadBookmarks(): BookmarkItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: BookmarkItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(loadBookmarks);

  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  const getBookmarksForNovel = useCallback((novelId: number) => {
    return bookmarks
      .filter(b => b.novelId === novelId)
      .sort((a, b) => a.chapterNumber - b.chapterNumber || a.scrollPercent - b.scrollPercent);
  }, [bookmarks]);

  const addBookmark = useCallback((item: Omit<BookmarkItem, 'timestamp'>) => {
    setBookmarks(prev => {
      const filtered = prev.filter(
        b => !(b.novelId === item.novelId && b.chapterId === item.chapterId && Math.abs(b.scrollPercent - item.scrollPercent) < 1)
      );
      const entry: BookmarkItem = { ...item, timestamp: Date.now() };
      return [entry, ...filtered].slice(0, MAX_BOOKMARKS);
    });
  }, []);

  const removeBookmark = useCallback((novelId: number, chapterId: number, scrollPercent: number) => {
    setBookmarks(prev => prev.filter(
      b => !(b.novelId === novelId && b.chapterId === chapterId && Math.abs(b.scrollPercent - scrollPercent) < 1)
    ));
  }, []);

  const isBookmarked = useCallback((novelId: number, chapterId: number, scrollPercent: number) => {
    return bookmarks.some(
      b => b.novelId === novelId && b.chapterId === chapterId && Math.abs(b.scrollPercent - scrollPercent) < 1
    );
  }, [bookmarks]);

  const clearBookmarks = useCallback((novelId?: number) => {
    if (novelId === undefined) {
      setBookmarks([]);
    } else {
      setBookmarks(prev => prev.filter(b => b.novelId !== novelId));
    }
  }, []);

  return {
    bookmarks,
    getBookmarksForNovel,
    addBookmark,
    removeBookmark,
    isBookmarked,
    clearBookmarks,
  };
}
