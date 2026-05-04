import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReader } from './ReaderContext';
import { usePagination } from '../hooks/usePagination';
import type { ReadingTheme } from './ReaderOverlay';
import { ChapterEngagementBar } from './ChapterEngagementBar';
import { useChapterEngagement } from '../hooks/useChapterEngagement';

interface PageFlipReaderProps {
  theme: ReadingTheme;
  fontSize: number;
  showToolbar: boolean;
  onToggleToolbar: () => void;
}

export function PageFlipReader({ theme, fontSize, onToggleToolbar }: PageFlipReaderProps) {
  const {
    content,
    chapter,
    novel,
    chapterIndex,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    lastNavigation,
    pageNext,
    pagePrev,
    setPageInfo,
    prefetchNextChapter,
    engagement: engagementFromContext,
  } = useReader();

  const { engagement, isLiked, isDisliked, loading, toggleLike, toggleDislike } = useChapterEngagement(
    novel?.id,
    chapter?.id,
    engagementFromContext
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [direction, setDirection] = useState(1);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const prevChapterIndexRef = useRef(chapterIndex);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setDims({
        width: Math.max(0, el.clientWidth - 48),
        height: Math.max(0, el.clientHeight - 24),
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { pages, totalPages: computedTotalPages } = usePagination({
    content,
    containerWidth: dims.width,
    containerHeight: dims.height,
    fontSize,
    lineHeight: 1.8,
  });

  useEffect(() => {
    if (pages.length === 0) return;

    const chapterChanged = chapterIndex !== prevChapterIndexRef.current;
    prevChapterIndexRef.current = chapterIndex;

    if (chapterChanged && lastNavigation === 'prev') {
      // Going backward across chapters — land on last page
      setPageInfo(Math.max(0, pages.length - 1), pages.length);
    } else if (chapterChanged) {
      // Going forward or explicit chapter jump — land on first page
      setPageInfo(0, pages.length);
    } else if (currentPage >= pages.length) {
      // Same chapter but page index out of bounds (e.g. after font size change)
      setPageInfo(Math.max(0, pages.length - 1), pages.length);
    } else {
      // Same chapter, pages recalculated — keep current page
      setPageInfo(currentPage, pages.length);
    }
  }, [pages.length, chapterIndex, lastNavigation, currentPage, setPageInfo]);

  useEffect(() => {
    if (currentPage >= computedTotalPages - 2) {
      prefetchNextChapter();
    }
  }, [currentPage, computedTotalPages, prefetchNextChapter]);

  const handlePageNext = useCallback(() => {
    setDirection(1);
    pageNext();
  }, [pageNext]);

  const handlePagePrev = useCallback(() => {
    setDirection(-1);
    pagePrev();
  }, [pagePrev]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const x = e.clientX;
    const width = window.innerWidth;
    if (x < width / 3) {
      handlePagePrev();
    } else if (x > (width * 2) / 3) {
      handlePageNext();
    } else {
      onToggleToolbar();
    }
  }, [handlePageNext, handlePagePrev, onToggleToolbar]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        handlePageNext();
      } else {
        handlePagePrev();
      }
    }
    touchStartRef.current = null;
  }, [handlePageNext, handlePagePrev]);

  const pageContent = pages[currentPage] ?? '';

  return (
    <div
      className="flex-1 relative overflow-hidden"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={containerRef}
        className="max-w-2xl mx-auto px-6 py-3 h-full flex flex-col"
        style={{ fontSize }}
      >
        {currentPage === 0 && (
          <h2 className="text-lg font-bold mb-2 text-center opacity-80">
            第{chapter?.chapter_number}章 {chapter?.title}
          </h2>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {currentPage === 0 && hasPrev && (
                <div className={`mb-4 text-center text-sm ${theme.progressText} opacity-50`}>
                  ← 上一章: {novel?.chapters[chapterIndex - 1]?.title}
                </div>
              )}
              <div className="leading-[1.8] whitespace-pre-wrap break-words">
                {pageContent}
              </div>
              {currentPage === totalPages - 1 && hasNext && (
                <div className={`mt-8 text-center text-sm ${theme.progressText} opacity-50`}>
                  下一章 → {novel?.chapters[chapterIndex + 1]?.title}
                </div>
              )}
              {currentPage === totalPages - 1 && (
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
                  className="mt-4"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
