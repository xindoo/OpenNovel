import { useState, useEffect } from 'react';
import { Search, TrendingUp, BookOpen } from 'lucide-react';
import { getNovels, getCategories, type Novel, type CategoryInfo } from '../api';
import { BookCard } from '../components/BookCard';

export function Discover() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [novelsRes, catsRes] = await Promise.all([
        getNovels(1, 100, selectedCategory || undefined),
        getCategories(),
      ]);
      if (novelsRes.success && novelsRes.data) setNovels(novelsRes.data.novels);
      if (catsRes.success && catsRes.data) setCategories(catsRes.data);
      setLoading(false);
    }
    load();
  }, [selectedCategory]);

  const filtered = search
    ? novels.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.author.toLowerCase().includes(search.toLowerCase())
      )
    : novels;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">发现</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索小说名称或作者..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
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
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {search ? '没有找到匹配的小说' : '暂无小说'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {filtered.map((novel, i) => (
            <BookCard key={novel.id} novel={novel} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
