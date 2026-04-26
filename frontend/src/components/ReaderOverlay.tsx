import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, List, Type, Sun, Moon } from 'lucide-react';
import { useReader } from '../components/ReaderContext';
import { useRecentReads } from '../hooks/useRecentReads';
import { getStorageUrl } from '../api';

const FONT_SIZES = [14, 16, 18, 20, 22] as const;
const THEMES = [
  { name: 'default', bg: 'bg-white dark:bg-gray-900', text: 'text-gray-900 dark:text-gray-100' },
  { name: 'sepia', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-900 dark:text-amber-100' },
  { name: 'green', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-900 dark:text-green-100' },
  { name: 'dark', bg: 'bg-gray-950', text: 'text-gray-200' },
] as const;

export function ReaderOverlay() {
  const {
    isOpen, novel, chapter, content,
    closeReader, goNext, goPrev, hasNext, hasPrev,
    goToChapter, chapterIndex,
  } = useReader();
  const { addRecentRead } = useRecentReads();

  const [fontSizeIdx, setFontSizeIdx] = useState(1);
  const [themeIdx, setThemeIdx] = useState(0);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeReader();
      if (e.key === 'ArrowLeft' && hasPrev) goPrev();
      if (e.key === 'ArrowRight' && hasNext) goNext();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, hasPrev, hasNext, closeReader, goPrev, goNext]);

  useEffect(() => {
    if (isOpen && novel && chapter) {
      addRecentRead({
        novelId: novel.id,
        title: novel.title,
        coverUrl: novel.cover_image_key ? getStorageUrl(novel.cover_image_key) : '',
        chapterId: chapter.id,
        chapterNumber: chapter.chapter_number,
        chapterTitle: chapter.title,
        totalChapters: novel.chapters.length,
      });
    }
  }, [isOpen, novel, chapter, addRecentRead]);

  const handleToggleToolbar = useCallback(() => {
    setShowToolbar(prev => !prev);
    setShowChapterList(false);
  }, []);

  if (!isOpen) return null;

  const theme = THEMES[themeIdx];
  const fontSize = FONT_SIZES[fontSizeIdx];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col"
      >
        {showToolbar && (
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            className="flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-10"
          >
            <button onClick={closeReader} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center px-4 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {novel?.title}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                第{chapter?.chapter_number}章 {chapter?.title}
              </p>
            </div>
            <button
              onClick={() => setShowChapterList(!showChapterList)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300"
            >
              <List className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        <div
          className={`flex-1 overflow-y-auto ${theme.bg} ${theme.text} scrollbar-thin`}
          onClick={handleToggleToolbar}
        >
          <div className="max-w-2xl mx-auto px-6 py-8" style={{ fontSize }}>
            <h2 className="text-lg font-bold mb-6 text-center opacity-80">
              第{chapter?.chapter_number}章 {chapter?.title}
            </h2>
            <div className="leading-[1.8] whitespace-pre-wrap break-words">
              {content || '加载中...'}
            </div>
          </div>
        </div>

        {showToolbar && (
          <motion.div
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 max-w-2xl mx-auto">
              <button
                onClick={goPrev}
                disabled={!hasPrev}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                上一章
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSizeIdx(Math.max(0, fontSizeIdx - 1))}
                  disabled={fontSizeIdx === 0}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 text-gray-600 dark:text-gray-300"
                >
                  <Type className="w-4 h-4" />
                  <span className="text-[10px] ml-0.5">A-</span>
                </button>
                <button
                  onClick={() => setFontSizeIdx(Math.min(FONT_SIZES.length - 1, fontSizeIdx + 1))}
                  disabled={fontSizeIdx === FONT_SIZES.length - 1}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 text-gray-600 dark:text-gray-300"
                >
                  <Type className="w-5 h-5" />
                  <span className="text-[10px] ml-0.5">A+</span>
                </button>
                <button
                  onClick={() => setThemeIdx((themeIdx + 1) % THEMES.length)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300"
                  title="切换阅读主题"
                >
                  {themeIdx === THEMES.length - 1 ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={goNext}
                disabled={!hasNext}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                下一章
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pb-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className="bg-purple-500 h-1 rounded-full transition-all"
                  style={{
                    width: novel
                      ? `${((chapterIndex + 1) / novel.chapters.length) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1">
                {chapterIndex + 1} / {novel?.chapters.length ?? 0}
              </p>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showChapterList && novel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[110]"
              onClick={() => setShowChapterList(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-72 sm:w-80 bg-white dark:bg-gray-900 shadow-xl overflow-y-auto scrollbar-thin"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white">章节列表</h3>
                  <p className="text-xs text-gray-400 mt-1">{novel.chapters.length} 章</p>
                </div>
                <div className="py-2">
                  {[...novel.chapters]
                    .sort((a, b) => a.chapter_number - b.chapter_number)
                    .map((ch, i) => (
                      <button
                        key={ch.id}
                        onClick={async () => {
                          setShowChapterList(false);
                          await goToChapter(i);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          i === chapterIndex
                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        第{ch.chapter_number}章 {ch.title}
                      </button>
                    ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
