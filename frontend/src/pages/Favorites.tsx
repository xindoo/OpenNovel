import { motion } from 'framer-motion';
import { Heart, Trash2, BookOpen } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useNavigate } from 'react-router-dom';


export function Favorites() {
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">收藏</h1>
          <span className="text-sm text-gray-400 dark:text-gray-500">({favorites.length})</span>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={clearFavorites}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清空
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">还没有收藏的小说</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            去书架看看
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {favorites.map((fav, i) => {
            const coverUrl = fav.coverUrl;
            return (
              <motion.div
                key={fav.novelId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="relative group cursor-pointer"
                onClick={() => navigate(`/novels/${fav.novelId}`)}
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-md group-hover:shadow-xl transition-shadow">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={fav.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900">
                      <BookOpen className="w-12 h-12 text-purple-400 dark:text-purple-500" />
                    </div>
                  )}
                </div>
                <div className="mt-2 px-0.5">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                    {fav.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fav.author}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(fav.novelId);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
