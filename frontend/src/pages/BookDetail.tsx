import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, BookOpen, List, ChevronRight, Eye } from 'lucide-react';
import { getNovel, getStorageUrl, getChapterEngagements, type NovelWithChapters, type ChapterEngagement } from '../api';
import { useReader } from '../components/ReaderContext';
import { useFavorites } from '../hooks/useFavorites';
import { useRecentReads } from '../hooks/useRecentReads';

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<NovelWithChapters | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChapters, setShowChapters] = useState(true);
  const [engagements, setEngagements] = useState<Map<number, ChapterEngagement>>(new Map());
  const { openReader } = useReader();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addRecentRead } = useRecentReads();

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const [novelRes, engRes] = await Promise.all([
        getNovel(Number(id)),
        getChapterEngagements(Number(id)),
      ]);
      if (novelRes.success && novelRes.data) setNovel(novelRes.data);
      if (engRes.success && engRes.data) {
        const map = new Map<number, ChapterEngagement>();
        for (const e of engRes.data) map.set(e.chapter_id, e);
        setEngagements(map);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="flex gap-6">
            <div className="w-36 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">小说不存在</p>
        <button onClick={() => navigate('/')} className="mt-4 text-purple-600 dark:text-purple-400 text-sm">
          返回书架
        </button>
      </div>
    );
  }

  const coverUrl = novel.cover_image_key ? getStorageUrl(novel.cover_image_key) : undefined;
  const isFav = isFavorite(novel.id);
  const sortedChapters = [...novel.chapters].sort((a, b) => a.chapter_number - b.chapter_number);

  const handleStartReading = async (chapterIndex = 0) => {
    if (!novel) return;
    const ch = sortedChapters[chapterIndex];
    if (ch) {
      addRecentRead({
        novelId: novel.id,
        title: novel.title,
        coverUrl: coverUrl || '',
        chapterId: ch.id,
        chapterNumber: ch.chapter_number,
        chapterTitle: ch.title,
        totalChapters: novel.chapters.length,
      });
    }
    await openReader({ ...novel, chapters: sortedChapters }, chapterIndex);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-6"
      >
        <div className="flex-shrink-0 w-36 h-48 rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
          {coverUrl ? (
            <img src={coverUrl} alt={novel.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800">
              <BookOpen className="w-12 h-12 text-purple-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
            {novel.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{novel.author}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {novel.category && novel.category.split(/[,，]/).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 text-xs whitespace-nowrap bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded">
                {tag.trim()}
              </span>
            ))}
            {novel.status && (
              <span className={`px-2 py-0.5 text-xs whitespace-nowrap rounded ${
                novel.status === 'completed'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
              }`}>
                {novel.status === 'completed' ? '已完结' : '连载中'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-4 leading-relaxed">
            {novel.description || '暂无简介'}
          </p>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => handleStartReading(0)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              开始阅读
            </button>
            <button
              onClick={() => toggleFavorite({
                novelId: novel.id,
                title: novel.title,
                coverUrl: coverUrl || '',
                author: novel.author,
                category: novel.category,
              })}
              className={`p-2 rounded-lg transition-colors ${
                isFav
                  ? 'text-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : 'text-gray-400 hover:text-pink-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </motion.div>

      <div>
        <button
          onClick={() => setShowChapters(!showChapters)}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-gray-900 dark:text-white">章节列表</span>
            <span className="text-sm text-gray-400">({sortedChapters.length}章)</span>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showChapters ? 'rotate-90' : ''}`} />
        </button>

        {showChapters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
          >
            {sortedChapters.map((ch, i) => (
              <button
                key={ch.id}
                onClick={() => handleStartReading(i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  第{ch.chapter_number}章 {ch.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {(() => {
                    const views = engagements.get(ch.id)?.views;
                    if (views && views > 0) {
                      return (
                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <Eye className="w-3 h-3" />
                          {views >= 10000 ? `${(views / 10000).toFixed(1)}万` : views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
                        </span>
                      );
                    }
                    return null;
                  })()}
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
