import { ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import type { ReadingTheme } from './ReaderOverlay';

interface ChapterEngagementBarProps {
  theme: ReadingTheme;
  likes: number;
  dislikes: number;
  views: number;
  isLiked: boolean;
  isDisliked: boolean;
  loading: boolean;
  onLike: () => void;
  onDislike: () => void;
  className?: string;
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function ChapterEngagementBar({
  theme,
  likes,
  dislikes,
  views,
  isLiked,
  isDisliked,
  loading,
  onLike,
  onDislike,
  className = '',
}: ChapterEngagementBarProps) {
  return (
    <div className={`pt-6 mt-8 border-t ${theme.toolbarBorder} ${className}`}>
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
            isLiked
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
              : `${theme.toolbarText} ${theme.toolbarHover}`
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isLiked ? '取消点赞' : '点赞'}
        >
          <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{formatCount(likes)}</span>
        </button>

        <div className={`flex items-center gap-1 text-sm ${theme.progressText}`}>
          <Eye className="w-4 h-4" />
          <span>{formatCount(views)}</span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDislike(); }}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
            isDisliked
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : `${theme.toolbarText} ${theme.toolbarHover}`
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isDisliked ? '取消点踩' : '点踩'}
        >
          <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-current' : ''}`} />
          <span>{formatCount(dislikes)}</span>
        </button>
      </div>
    </div>
  );
}
