import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import type { Novel } from '../api';
import { getStorageUrl } from '../api';

interface BookCardProps {
  novel: Novel;
  index?: number;
}

export function BookCard({ novel, index = 0 }: BookCardProps) {
  const navigate = useNavigate();
  const coverUrl = novel.cover_image_key ? getStorageUrl(novel.cover_image_key) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/novels/${novel.id}`)}
      className="cursor-pointer group flex flex-col"
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow bg-gray-100 dark:bg-gray-800">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={novel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800">
            <BookOpen className="w-12 h-12 text-purple-400 dark:text-purple-500" />
          </div>
        )}
        {novel.status === 'ongoing' && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded">
            连载中
          </span>
        )}
        {novel.status === 'completed' && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded">
            已完结
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {novel.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
          {novel.author}
        </p>
      </div>
    </motion.div>
  );
}
