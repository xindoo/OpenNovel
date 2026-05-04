import { motion } from 'framer-motion';
import { Clock, Trash2, BookOpen } from 'lucide-react';
import { useRecentReads } from '../hooks/useRecentReads';
import { getNovel } from '../api';
import { useReader } from '../components/ReaderContext';
import { useNavigate } from 'react-router-dom';


export function Recent() {
  const { recentReads, addRecentRead, removeRecentRead, clearRecentReads } = useRecentReads();
  const { openReader } = useReader();
  const navigate = useNavigate();

  const handleContinueReading = async (r: typeof recentReads[number]) => {
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
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">最近阅读</h1>
          <span className="text-sm text-gray-400 dark:text-gray-500">({recentReads.length})</span>
        </div>
        {recentReads.length > 0 && (
          <button
            onClick={clearRecentReads}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清空
          </button>
        )}
      </div>

      {recentReads.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">还没有阅读记录</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            去书架看看
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {recentReads.map((record, i) => {
            const coverUrl = record.coverUrl;
            return (
              <motion.div
                key={`${record.novelId}-${record.chapterId}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow group"
              >
                <div
                  className="flex-shrink-0 w-12 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer"
                  onClick={() => handleContinueReading(record)}
                >
                  {coverUrl ? (
                    <img src={coverUrl} alt={record.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </div>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleContinueReading(record)}
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                    {record.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    读到：第{record.chapterNumber}章 {record.chapterTitle}
                  </p>
                  {record.totalChapters > 0 && (
                    <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-purple-500 h-1 rounded-full transition-all"
                        style={{ width: `${(record.chapterNumber / record.totalChapters) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentRead(record.novelId);
                  }}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all text-gray-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
