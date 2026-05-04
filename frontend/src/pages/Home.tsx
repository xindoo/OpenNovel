import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import { getNovels, getNovel, getCategories, type Novel, type CategoryInfo } from '../api';
import { BookCard } from '../components/BookCard';
import { useRecentReads } from '../hooks/useRecentReads';
import { useReader } from '../components/ReaderContext';

export function Home() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { recentReads, addRecentRead } = useRecentReads();
  const { openReader } = useReader();

  const handleContinueReading = useCallback(async (r: typeof recentReads[number]) => {
    const res = await getNovel(r.novelId);
    if (!res.success || !res.data) return;
    const novel = res.data;
    const sortedChapters = [...novel.chapters].sort((a, b) => a.chapter_number - b.chapter_number);
    const chapterIndex = sortedChapters.findIndex(ch => ch.id === r.chapterId);
    const idx = chapterIndex >= 0 ? chapterIndex : 0;
    const ch = sortedChapters[idx];
    if (ch) {
      addRecentRead({
        novelId: novel.id,
        title: novel.title,
        coverUrl: r.coverUrl,
        chapterId: ch.id,
        chapterNumber: ch.chapter_number,
        chapterTitle: ch.title,
        totalChapters: novel.chapters.length,
      });
    }
    await openReader({ ...novel, chapters: sortedChapters }, idx);
  }, [addRecentRead, openReader]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [novelsRes, catsRes] = await Promise.all([
        getNovels(1, 50, selectedCategory || undefined),
        getCategories(),
      ]);
      if (novelsRes.success && novelsRes.data) setNovels(novelsRes.data.novels);
      if (catsRes.success && catsRes.data) setCategories(catsRes.data);
      setLoading(false);
    }
    load();
  }, [selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {recentReads.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">继续阅读</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2">
            {recentReads.slice(0, 6).map((r) => (
              <motion.div
                key={r.novelId}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleContinueReading(r)}
                className="flex-shrink-0 w-28 cursor-pointer"
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shadow">
                  {r.coverUrl ? (
                    <img src={r.coverUrl} alt={r.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-1">{r.title}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  第{r.chapterNumber}章
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">书架</h2>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.name
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="mt-1 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : novels.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无小说</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {novels.map((novel, i) => (
              <BookCard key={novel.id} novel={novel} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
