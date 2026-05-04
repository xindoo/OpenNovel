import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, List, Type, Sun, Moon, BookOpen, TextAlignJustify, Bookmark, BookmarkCheck, Eye } from 'lucide-react';
import { useReader } from '../components/ReaderContext';
import { PageFlipReader } from './PageFlipReader';
import { useRecentReads } from '../hooks/useRecentReads';
import { useBookmarks } from '../hooks/useBookmarks';
import type { BookmarkItem } from '../hooks/useBookmarks';
import { getStorageUrl } from '../api';
import { ChapterEngagementBar } from './ChapterEngagementBar';
import { useChapterEngagement } from '../hooks/useChapterEngagement';

const FONT_SIZES = [14, 16, 18, 20, 22] as const;

export interface ReadingTheme {
  name: string;
  label: string;
  bg: string;
  text: string;
  toolbarBg: string;
  toolbarText: string;
  toolbarHover: string;
  toolbarBorder: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarHover: string;
  sidebarBorder: string;
  progressBg: string;
  progressText: string;
}

const THEMES: ReadingTheme[] = [
  {
    name: 'default',
    label: '默认',
    bg: 'bg-white',
    text: 'text-gray-900',
    toolbarBg: 'bg-white/90',
    toolbarText: 'text-gray-600',
    toolbarHover: 'hover:bg-gray-100',
    toolbarBorder: 'border-gray-200',
    sidebarBg: 'bg-white',
    sidebarText: 'text-gray-700',
    sidebarHover: 'hover:bg-gray-50',
    sidebarBorder: 'border-gray-200',
    progressBg: 'bg-gray-200',
    progressText: 'text-gray-400',
  },
  {
    name: 'sepia',
    label: '护眼',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    toolbarBg: 'bg-amber-50/90',
    toolbarText: 'text-amber-700',
    toolbarHover: 'hover:bg-amber-100',
    toolbarBorder: 'border-amber-200',
    sidebarBg: 'bg-amber-50',
    sidebarText: 'text-amber-800',
    sidebarHover: 'hover:bg-amber-100',
    sidebarBorder: 'border-amber-200',
    progressBg: 'bg-amber-200',
    progressText: 'text-amber-500',
  },
  {
    name: 'green',
    label: '绿色',
    bg: 'bg-green-50',
    text: 'text-green-900',
    toolbarBg: 'bg-green-50/90',
    toolbarText: 'text-green-700',
    toolbarHover: 'hover:bg-green-100',
    toolbarBorder: 'border-green-200',
    sidebarBg: 'bg-green-50',
    sidebarText: 'text-green-800',
    sidebarHover: 'hover:bg-green-100',
    sidebarBorder: 'border-green-200',
    progressBg: 'bg-green-200',
    progressText: 'text-green-500',
  },
  {
    name: 'dark',
    label: '夜间',
    bg: 'bg-gray-950',
    text: 'text-gray-200',
    toolbarBg: 'bg-gray-950/90',
    toolbarText: 'text-gray-400',
    toolbarHover: 'hover:bg-gray-800',
    toolbarBorder: 'border-gray-800',
    sidebarBg: 'bg-gray-950',
    sidebarText: 'text-gray-300',
    sidebarHover: 'hover:bg-gray-900',
    sidebarBorder: 'border-gray-800',
    progressBg: 'bg-gray-800',
    progressText: 'text-gray-600',
  },
];

export function ReaderOverlay() {
  const {
    isOpen, novel, chapter, content,
    closeReader, goNext, goPrev, hasNext, hasPrev,
    goToChapter, chapterIndex,
    readingMode, setReadingMode, pageNext, pagePrev,
    currentPage, totalPages, setPageInfo,
    fontSizeIdx, themeIdx, setFontSizeIdx, setThemeIdx,
    engagement: engagementFromContext,
  } = useReader();
  const { addRecentRead } = useRecentReads();

  const [showToolbar, setShowToolbar] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);

  useEffect(() => {
    if (isOpen) setShowChapterList(false);
  }, [isOpen]);

  const { getBookmarksForNovel, addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const [sidebarTab, setSidebarTab] = useState<'chapters' | 'bookmarks'>('chapters');
  const [scrollModePercent, setScrollModePercent] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const { engagement, isLiked, isDisliked, loading, toggleLike, toggleDislike } = useChapterEngagement(
    novel?.id,
    chapter?.id,
    engagementFromContext
  );

  const currentScrollPercent = readingMode === 'page'
    ? (totalPages > 1 ? Math.round((currentPage / (totalPages - 1)) * 100 * 10) / 10 : 0)
    : scrollModePercent;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeReader();
      if (readingMode === 'page') {
        if (e.key === 'ArrowLeft') pagePrev();
        if (e.key === 'ArrowRight') pageNext();
      } else {
        if (e.key === 'ArrowLeft' && hasPrev) goPrev();
        if (e.key === 'ArrowRight' && hasNext) goNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, hasPrev, hasNext, closeReader, goPrev, goNext, readingMode, pageNext, pagePrev]);

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

  useEffect(() => {
    const el = contentRef.current;
    if (!el || !isOpen) return;

    const handleScroll = () => {
      const scrollPercent = el.scrollTop / (el.scrollHeight - el.clientHeight) * 100;
      setScrollModePercent(Math.round(scrollPercent * 10) / 10);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isOpen, readingMode]);

  const handleToggleToolbar = useCallback(() => {
    setShowToolbar(prev => !prev);
    setShowChapterList(false);
  }, []);

  const handleThemeChange = useCallback((idx: number) => {
    setThemeIdx(idx % THEMES.length);
  }, [setThemeIdx]);

  const handleToggleBookmark = useCallback(() => {
    if (!novel || !chapter) return;

    const scrollPercent = currentScrollPercent;

    let surroundingText = '';
    if (readingMode === 'scroll') {
      const el = contentRef.current;
      if (el) {
        const textContent = el.textContent || '';
        const charPosition = Math.floor((scrollPercent / 100) * textContent.length);
        const start = Math.max(0, charPosition - 30);
        const end = Math.min(textContent.length, charPosition + 30);
        surroundingText = textContent.slice(start, end);
      }
    } else {
      const textContent = content || '';
      const charPosition = Math.floor((scrollPercent / 100) * textContent.length);
      const start = Math.max(0, charPosition - 30);
      const end = Math.min(textContent.length, charPosition + 30);
      surroundingText = textContent.slice(start, end);
    }

    if (isBookmarked(novel.id, chapter.id, scrollPercent)) {
      removeBookmark(novel.id, chapter.id, scrollPercent);
    } else {
      addBookmark({
        novelId: novel.id,
        chapterId: chapter.id,
        chapterNumber: chapter.chapter_number,
        chapterTitle: chapter.title,
        scrollPercent,
        surroundingText,
      });
    }
  }, [novel, chapter, currentScrollPercent, readingMode, content, isBookmarked, addBookmark, removeBookmark]);

  const handleBookmarkClick = useCallback(async (bookmark: BookmarkItem) => {
    if (!novel) return;

    const chIndex = novel.chapters.findIndex(ch => ch.id === bookmark.chapterId);
    if (chIndex === -1) return;

    const chapterChanged = chapterIndex !== chIndex;

    if (chapterChanged) {
      await goToChapter(chIndex);
    }

    if (readingMode === 'page' && totalPages > 1) {
      const targetPage = Math.round((bookmark.scrollPercent / 100) * (totalPages - 1));
      if (chapterChanged) {
        setTimeout(() => setPageInfo(targetPage, totalPages), 100);
      } else {
        setPageInfo(targetPage, totalPages);
      }
    } else {
      const delay = chapterChanged ? 500 : 0;
      setTimeout(() => {
        const el = contentRef.current;
        if (!el) return;
        const targetScroll = (bookmark.scrollPercent / 100) * (el.scrollHeight - el.clientHeight);
        el.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }, delay);
    }

    setShowChapterList(false);
  }, [novel, chapterIndex, readingMode, totalPages, goToChapter, setPageInfo]);

  if (!isOpen) return null;

  const theme = THEMES[themeIdx];
  const fontSize = FONT_SIZES[fontSizeIdx];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] flex flex-col ${theme.bg} ${theme.text}`}
      >
        {showToolbar && (
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            className={`flex items-center justify-between px-4 py-3 ${theme.toolbarBg} backdrop-blur-md border-b ${theme.toolbarBorder} z-10`}
          >
            <button onClick={closeReader} className={`p-1.5 ${theme.toolbarHover} rounded-lg ${theme.toolbarText}`}>
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center px-4 min-w-0">
              <p className={`text-sm font-medium ${theme.text} truncate`}>
                {novel?.title}
              </p>
              <p className={`text-xs ${theme.progressText} truncate`}>
                第{chapter?.chapter_number}章 {chapter?.title}
                {engagement && engagement.views > 0 && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5">
                    <Eye className="w-3 h-3 inline" />
                    {engagement.views >= 10000 ? `${(engagement.views / 10000).toFixed(1)}万` : engagement.views >= 1000 ? `${(engagement.views / 1000).toFixed(1)}k` : engagement.views}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => { setShowChapterList(!showChapterList); if (!showChapterList) setSidebarTab('chapters'); }}
              className={`p-1.5 ${theme.toolbarHover} rounded-lg ${theme.toolbarText}`}
            >
              <List className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {readingMode === 'page' ? (
          <PageFlipReader
            theme={theme}
            fontSize={fontSize}
            showToolbar={showToolbar}
            onToggleToolbar={handleToggleToolbar}
          />
        ) : (
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto scrollbar-thin"
            onClick={handleToggleToolbar}
          >
            <div className="max-w-2xl mx-auto px-6 py-3" style={{ fontSize }}>
              <h2 className="text-lg font-bold mb-2 text-center opacity-80">
                第{chapter?.chapter_number}章 {chapter?.title}
              </h2>
              <div className="leading-[1.8] whitespace-pre-wrap break-words">
                {content || '加载中...'}
              </div>
              <ChapterEngagementBar
                theme={theme}
                likes={engagement?.likes ?? 0}
                dislikes={engagement?.dislikes ?? 0}
                views={engagement?.views ?? 0}
                isLiked={isLiked}
                isDisliked={isDisliked}
                loading={loading}
                onLike={toggleLike}
                onDislike={toggleDislike}
              />
            </div>
          </div>
        )}

        {showToolbar && (
          <motion.div
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            className={`${theme.toolbarBg} backdrop-blur-md border-t ${theme.toolbarBorder} z-10`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 py-2 max-w-2xl mx-auto">
              <button
                onClick={goPrev}
                disabled={!hasPrev}
                className={`flex items-center gap-1 px-2 py-2 text-sm whitespace-nowrap shrink-0 ${theme.toolbarText} ${theme.toolbarHover} rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                上一章
              </button>

              <div className="flex items-center gap-1 sm:gap-3 min-w-0">
                <button
                  onClick={handleToggleBookmark}
                  className={`p-1.5 ${theme.toolbarHover} rounded-lg ${theme.toolbarText}`}
                  title="添加书签"
                >
                  {novel && chapter && isBookmarked(novel.id, chapter.id, currentScrollPercent)
                    ? <BookmarkCheck className="w-4 h-4 text-purple-500" />
                    : <Bookmark className="w-4 h-4" />
                  }
                </button>
                <button
                  onClick={() => setFontSizeIdx(Math.max(0, fontSizeIdx - 1))}
                  disabled={fontSizeIdx === 0}
                  className={`p-1.5 ${theme.toolbarHover} rounded-lg disabled:opacity-30 ${theme.toolbarText}`}
                >
                  <Type className="w-4 h-4" />
                  <span className="text-[10px] ml-0.5">A-</span>
                </button>
                <button
                  onClick={() => setFontSizeIdx(Math.min(FONT_SIZES.length - 1, fontSizeIdx + 1))}
                  disabled={fontSizeIdx === FONT_SIZES.length - 1}
                  className={`p-1.5 ${theme.toolbarHover} rounded-lg disabled:opacity-30 ${theme.toolbarText}`}
                >
                  <Type className="w-5 h-5" />
                  <span className="text-[10px] ml-0.5">A+</span>
                </button>
                <button
                  onClick={() => setReadingMode(readingMode === 'page' ? 'scroll' : 'page')}
                  className={`p-1.5 ${theme.toolbarHover} rounded-lg ${theme.toolbarText}`}
                  title={`切换阅读模式 (${readingMode === 'page' ? '翻页' : '滚动'})`}
                >
                  {readingMode === 'page' ? <BookOpen className="w-4 h-4" /> : <TextAlignJustify className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleThemeChange(themeIdx + 1)}
                  className={`p-1.5 ${theme.toolbarHover} rounded-lg ${theme.toolbarText}`}
                  title={`切换阅读主题 (${theme.label})`}
                >
                  {themeIdx === THEMES.length - 1 ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={goNext}
                disabled={!hasNext}
                className={`flex items-center gap-1 px-2 py-2 text-sm whitespace-nowrap shrink-0 ${theme.toolbarText} ${theme.toolbarHover} rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
              >
                下一章
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div className="px-4 pb-2">
              <div className={`w-full ${theme.progressBg} rounded-full h-1`}>
                <div
                  className="bg-purple-500 h-1 rounded-full transition-all"
                  style={{
                    width: novel
                      ? `${((chapterIndex + 1) / novel.chapters.length) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <p className={`text-[10px] ${theme.progressText} text-center mt-1`}>
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
                className={`absolute right-0 top-0 bottom-0 w-72 sm:w-80 ${theme.sidebarBg} shadow-xl overflow-y-auto scrollbar-thin`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`p-4 border-b ${theme.sidebarBorder}`}>
                  <div className="flex gap-1 mb-2">
                    <button
                      onClick={() => setSidebarTab('chapters')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        sidebarTab === 'chapters'
                          ? 'bg-purple-100 text-purple-700'
                          : `${theme.sidebarText} ${theme.sidebarHover}`
                      }`}
                    >
                      章节列表
                    </button>
                    <button
                      onClick={() => setSidebarTab('bookmarks')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        sidebarTab === 'bookmarks'
                          ? 'bg-purple-100 text-purple-700'
                          : `${theme.sidebarText} ${theme.sidebarHover}`
                      }`}
                    >
                      书签{novel ? ` (${getBookmarksForNovel(novel.id).length})` : ''}
                    </button>
                  </div>
                  {sidebarTab === 'chapters' && (
                    <p className={`text-xs ${theme.progressText}`}>{novel?.chapters.length ?? 0} 章</p>
                  )}
                </div>
                {sidebarTab === 'chapters' && novel && (
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
                            : `${theme.sidebarText} ${theme.sidebarHover}`
                        }`}
                      >
                        第{ch.chapter_number}章 {ch.title}
                      </button>
                    ))}
                </div>
                )}
                {sidebarTab === 'bookmarks' && novel && (
                  <div className="py-2">
                    {getBookmarksForNovel(novel.id).length === 0 ? (
                      <div className={`px-4 py-8 text-center text-sm ${theme.progressText}`}>
                        暂无书签
                      </div>
                    ) : (
                      getBookmarksForNovel(novel.id).map((bm, i) => (
                        <button
                          key={`${bm.novelId}-${bm.chapterId}-${bm.scrollPercent}-${i}`}
                          onClick={() => handleBookmarkClick(bm)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            chapter?.id === bm.chapterId
                              ? 'bg-purple-50 text-purple-700'
                              : `${theme.sidebarText} ${theme.sidebarHover}`
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Bookmark className="w-3 h-3 text-purple-500 flex-shrink-0" />
                            <span className="font-medium truncate">第{bm.chapterNumber}章 · {bm.scrollPercent.toFixed(0)}%</span>
                          </div>
                          {bm.surroundingText && (
                            <p className={`text-xs mt-1 ${theme.progressText} truncate`}>
                              {bm.surroundingText}
                            </p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
