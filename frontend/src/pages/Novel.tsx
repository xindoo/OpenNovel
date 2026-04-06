import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNovel, getStorageUrl } from '../api';
import type { NovelWithChapters } from '../../../src/types';

export function Novel() {
  const { novelId } = useParams<{ novelId: string }>();
  const [novel, setNovel] = useState<NovelWithChapters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNovel() {
      if (!novelId) {
        setError('Invalid novel ID');
        setLoading(false);
        return;
      }

      try {
        const response = await getNovel(parseInt(novelId));
        if (response.success && response.data) {
          setNovel(response.data);
        } else {
          setError(response.error || 'Failed to load novel');
        }
      } catch (err) {
        setError('Failed to load novel');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadNovel();
  }, [novelId]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: 'ongoing' | 'completed') => {
    return status === 'ongoing' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-green-100 text-green-800';
  };

  const getStatusText = (status: 'ongoing' | 'completed') => {
    return status === 'ongoing' ? 'Ongoing' : 'Completed';
  };

  // Sort chapters by chapter number - create copy to avoid mutating original
  const sortedChapters = [...(novel?.chapters || [])].sort((a, b) => a.chapter_number - b.chapter_number);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded-md px-3 py-2 -ml-3"
          >
            ← Back to novels
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
            >
              Return to homepage
            </Link>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse">
            <div className="flex flex-col lg:flex-row gap-8 mb-8">
              <div className="lg:w-1/3">
                <div className="aspect-[2/3] bg-gray-200 rounded-lg" />
              </div>
              <div className="lg:w-2/3 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-20" />
                  <div className="h-6 bg-gray-200 rounded w-24" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && novel && (
          <>
            {/* Top section: cover + info */}
            <div className="flex flex-col lg:flex-row gap-8 mb-12">
              {/* Left column: Cover */}
              <div className="lg:w-1/3 lg:sticky lg:top-28 self-start">
                <div className="aspect-[2/3] relative bg-gray-50 rounded-lg overflow-hidden shadow-md">
                   {novel.cover_image_key ? (
                     <img
                       src={getStorageUrl(novel.cover_image_key)}
                       alt={novel.title}
                       loading="lazy"
                       className="absolute inset-0 w-full h-full object-cover"
                     />
                   ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <span className="text-gray-400 text-sm">No cover available</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right column: Novel info */}
              <div className="lg:w-2/3">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">
                  {novel.title}
                </h1>
                <p className="text-xl text-gray-600 mb-6">by {novel.author}</p>

                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {novel.category}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(novel.status)}`}>
                    {getStatusText(novel.status)}
                  </span>
                </div>

                <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {novel.description}
                  </p>
                </div>

                <p className="text-sm text-gray-500">
                  Last updated: {formatDate(novel.updated_at)}
                </p>
              </div>
            </div>

            {/* Chapter list */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Chapters {sortedChapters.length > 0 && `(${sortedChapters.length})`}
              </h2>

              {sortedChapters.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No chapters available yet.</p>
              ) : (
                <ol className="divide-y divide-gray-100">
                  {sortedChapters.map((chapter) => (
                    <li key={chapter.id} className="py-3">
                      <Link
                        to={`/novel/${novel.id}/chapter/${chapter.id}`}
                        className="group flex items-center justify-between hover:bg-gray-50 -mx-3 px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-8 text-center text-sm font-medium text-gray-400 group-hover:text-gray-600">
                            {chapter.chapter_number}.
                          </span>
                          <span className="text-gray-900 font-medium group-hover:text-gray-600 transition-colors">
                            {chapter.title}
                          </span>
                        </div>
                         <span aria-hidden="true" className="text-gray-400 text-sm group-hover:text-gray-600 transition-colors">
                           →
                         </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="mt-auto py-8 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>OpenNovel - Read free novels online</p>
        </div>
      </footer>
    </div>
  );
}
