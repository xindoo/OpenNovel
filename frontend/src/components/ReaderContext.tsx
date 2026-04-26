import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { NovelWithChapters, Chapter } from '../api';

interface ReaderState {
  isOpen: boolean;
  novel: NovelWithChapters | null;
  chapter: Chapter | null;
  chapterIndex: number;
  content: string;
}

interface ReaderContextValue extends ReaderState {
  openReader: (novel: NovelWithChapters, chapterIndex?: number) => Promise<void>;
  closeReader: () => void;
  goToChapter: (index: number) => Promise<void>;
  goNext: () => Promise<void>;
  goPrev: () => Promise<void>;
  hasNext: boolean;
  hasPrev: boolean;
}

const initialState: ReaderState = {
  isOpen: false,
  novel: null,
  chapter: null,
  chapterIndex: 0,
  content: '',
};

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReaderState>(initialState);

  const loadChapter = useCallback(async (novel: NovelWithChapters, index: number) => {
    const chapter = novel.chapters[index];
    if (!chapter) return;

    const { getChapter } = await import('../api');
    const result = await getChapter(novel.id, chapter.id);
    if (result.success && result.data) {
      setState(prev => ({
        ...prev,
        chapter: result.data!.chapter,
        content: result.data!.content,
        chapterIndex: index,
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
    });
    await loadChapter(novel, chapterIndex);
  }, [loadChapter]);

  const closeReader = useCallback(() => {
    setState(initialState);
  }, []);

  const goToChapter = useCallback(async (index: number) => {
    if (!state.novel) return;
    await loadChapter(state.novel, index);
  }, [state.novel, loadChapter]);

  const goNext = useCallback(async () => {
    if (!state.novel || state.chapterIndex >= state.novel.chapters.length - 1) return;
    await loadChapter(state.novel, state.chapterIndex + 1);
  }, [state.novel, state.chapterIndex, loadChapter]);

  const goPrev = useCallback(async () => {
    if (!state.novel || state.chapterIndex <= 0) return;
    await loadChapter(state.novel, state.chapterIndex - 1);
  }, [state.novel, state.chapterIndex, loadChapter]);

  const value: ReaderContextValue = {
    ...state,
    openReader,
    closeReader,
    goToChapter,
    goNext,
    goPrev,
    hasNext: state.novel ? state.chapterIndex < state.novel.chapters.length - 1 : false,
    hasPrev: state.chapterIndex > 0,
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
