import { Link } from 'react-router-dom';
import { Novel } from '../../../src/types';
import { getStorageUrl } from '../api';

interface NovelCardProps {
  novel: Novel;
}

export function NovelCard({ novel }: NovelCardProps) {
  const hasCover = novel.cover_image_key;

  return (
    <Link
      to={`/novel/${novel.id}`}
      className="group relative block bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-xl duration-300 hover:-translate-y-1 transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
    >
      <div className="aspect-[2/3] relative bg-gray-50 overflow-hidden">
        {hasCover ? (
          <img
            src={getStorageUrl(novel.cover_image_key!)}
            alt={novel.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <span className="text-gray-400 text-sm">No cover</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-block px-2 py-1 bg-white/90 text-xs font-medium text-gray-800 rounded">
            {novel.status === 'ongoing' ? 'Ongoing' : 'Completed'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1 group-hover:text-gray-600 transition-colors">
          {novel.title}
        </h3>
        <p className="text-sm text-gray-500 mb-2">{novel.author}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {novel.category.split(',').map((tag, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400 line-clamp-2">
          {novel.description}
        </p>
      </div>
    </Link>
  );
}
