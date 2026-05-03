import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import type { NovelWithChapters, Chapter } from '../api';

export type ReadingMode = 'page' | 'scroll';

interface ReaderState {
  isOpen: boolean;
  novel: NovelWithChapters | null;
  chapter: Chapter | null;
  chapterIndex: number;
  content: string;
  readingMode: ReadingMode;
  currentPage: number;
  totalPages: number;
  lastNavigation: 'next' | 'prev' | 'goto' | null;
}

interface ReaderContextValue extends ReaderState {
  openReader: (novel: NovelWithChapters, chapterIndex?: number) => Promise<void>;
  closeReader: () => void;
  goToChapter: (index: number) => Promise<void>;
  goNext: () => Promise<void>;
  goPrev: () => Promise<void>;
  hasNext: boolean;
  hasPrev: boolean;
  setReadingMode: (mode: ReadingMode) => void;
  setPageInfo: (current: number, total: number) => void;
  pageNext: () => void;
  pagePrev: () => void;
  prefetchNextChapter: () => Promise<void>;
}

function getInitialReadingMode(): ReadingMode {
  if (typeof window === 'undefined') return 'page';
  const stored = localStorage.getItem('opennovel-reading-mode');
  return stored === 'scroll' ? 'scroll' : 'page';
}

const initialState: ReaderState = {
  isOpen: false,
  novel: null,
  chapter: null,
  chapterIndex: 0,
  content: '',
  readingMode: getInitialReadingMode(),
  currentPage: 0,
  totalPages: 0,
  lastNavigation: null,
};

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReaderState>(initialState);
  const prefetchCache = useRef<Map<number, { chapter: Chapter; content: string }>>(new Map());

  const loadChapter = useCallback(async (novel: NovelWithChapters, index: number, resetPage = true) => {
    const chapter = novel.chapters[index];
    if (!chapter) return;

    const cached = prefetchCache.current.get(index);
    if (cached) {
      setState(prev => ({
        ...prev,
        chapter: cached.chapter,
        content: cached.content,
        chapterIndex: index,
        currentPage: resetPage ? 0 : prev.currentPage,
      }));
      return;
    }

    const { getChapter } = await import('../api');
    const result = await getChapter(novel.id, chapter.id);
    if (result.success && result.data) {
      setState(prev => ({
        ...prev,
        chapter: result.data!.chapter,
        content: result.data!.content,
        chapterIndex: index,
        currentPage: resetPage ? 0 : prev.currentPage,
      }));
    }
  }, []);

  const openReader = useCallback(async (novel: NovelWithChapters, chapterIndex = 0) => {
    setState({
      isOpen: true,
      novel,
      chapter: novel.chapters[chapterIndex] || null,
      chapterIndex,
      content: '',
      readingMode: getInitialReadingMode(),
      currentPage: 0,
      totalPages: 0,
      lastNavigation: null,
    });
    prefetchCache.current.clear();
    await loadChapter(novel, chapterIndex);
  }, [loadChapter]);

  const closeReader = useCallback(() => {
    setState(initialState);
  }, []);

  const goToChapter = useCallback(async (index: number) => {
    if (!state.novel) return;
    setState(prev => ({ ...prev, lastNavigation: 'goto' }));
    await loadChapter(state.novel, index, true);
  }, [state.novel, loadChapter]);

  const goNext = useCallback(async () => {
    if (!state.novel || state.chapterIndex >= state.novel.chapters.length - 1) return;
    await loadChapter(state.novel, state.chapterIndex + 1, false);
  }, [state.novel, state.chapterIndex, loadChapter]);

  const goPrev = useCallback(async () => {
    if (!state.novel || state.chapterIndex <= 0) return;
    await loadChapter(state.novel, state.chapterIndex - 1, false);
  }, [state.novel, state.chapterIndex, loadChapter]);

  const setReadingMode = useCallback((mode: ReadingMode) => {
    localStorage.setItem('opennovel-reading-mode', mode);
    setState(prev => ({ ...prev, readingMode: mode }));
  }, []);

  const setPageInfo = useCallback((current: number, total: number) => {
    setState(prev => ({
      ...prev,
      currentPage: current,
      totalPages: total,
      lastNavigation: null,
    }));
  }, []);

  const pageNext = useCallback(() => {
    if (state.currentPage < state.totalPages - 1) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    } else if (state.novel && state.chapterIndex < state.novel.chapters.length - 1) {
      setState(prev => ({ ...prev, lastNavigation: 'next' }));
      goNext();
    }
  }, [state.currentPage, state.totalPages, state.novel, state.chapterIndex, goNext]);

  const pagePrev = useCallback(() => {
    if (state.currentPage > 0) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    } else if (state.chapterIndex > 0) {
      setState(prev => ({ ...prev, lastNavigation: 'prev' }));
      goPrev();
    }
  }, [state.currentPage, state.chapterIndex, goPrev]);

  const prefetchNextChapter = useCallback(async () => {
    if (!state.novel) return;
    const nextIndex = state.chapterIndex + 1;
    if (nextIndex >= state.novel.chapters.length) return;
    if (prefetchCache.current.has(nextIndex)) return;

    const nextChapter = state.novel.chapters[nextIndex];
    const { getChapter } = await import('../api');
    const result = await getChapter(state.novel.id, nextChapter.id);
    if (result.success && result.data) {
      prefetchCache.current.set(nextIndex, {
        chapter: result.data.chapter,
        content: result.data.content,
      });
    }
  }, [state.novel, state.chapterIndex]);

  const value: ReaderContextValue = {
    ...state,
    openReader,
    closeReader,
    goToChapter,
    goNext,
    goPrev,
    hasNext: state.novel ? state.chapterIndex < state.novel.chapters.length - 1 : false,
    hasPrev: state.chapterIndex > 0,
    setReadingMode,
    setPageInfo,
    pageNext,
    pagePrev,
    prefetchNextChapter,
  };

  return (
    <ReaderContext.Provider value={value}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error('useReader must be used within ReaderProvider');
  return ctx;
}
