import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import {
  createNovel,
  updateNovel,
  deleteNovel,
  uploadCover,
  getNovel,
  getStorageUrl,
  getCategories,
} from '../../api';
import type { Novel } from '../../api';

export function NovelEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id && id !== 'new');

  const [formData, setFormData] = useState<{
    title: string;
    author: string;
    description: string;
    category: string;
    status: 'ongoing' | 'completed';
    cover_image_key: string | null;
  }>({
    title: '',
    author: '',
    description: '',
    category: '',
    status: 'ongoing',
    cover_image_key: null,
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch categories for dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          const categoryNames = response.data.map(cat => cat.name).sort();
          setCategories(categoryNames);
        }
      } catch (err) {
        // Fail silently - if categories can't load, user can still type manually
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!isEditMode || !id) {
      return;
    }

    const loadNovel = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getNovel(parseInt(id));
        if (response.success && response.data) {
          const novelData = response.data;
          setNovel(novelData);
          setFormData({
            title: novelData.title,
            author: novelData.author,
            description: novelData.description,
            category: novelData.category,
            status: novelData.status,
            cover_image_key: novelData.cover_image_key,
          });
        } else {
          setError(response.error || 'Failed to load novel');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadNovel();
  }, [id, isEditMode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (status: 'ongoing' | 'completed') => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditMode || !novel || !e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setUploading(true);
    setError(null);

    try {
      const response = await uploadCover(novel.id, file);
      if (response.success && response.data) {
        const refreshed = await getNovel(novel.id);
        if (refreshed.success && refreshed.data) {
          setNovel(refreshed.data);
        }
      } else {
        setError(response.error || 'Failed to upload cover');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.author.trim() || !formData.description.trim() || !formData.category.trim()) {
      setError('Title, Author, Description, and Category are required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode && id) {
        const response = await updateNovel(parseInt(id), formData);
        if (!response.success) {
          setError(response.error || 'Failed to update novel');
          return;
        }
      } else {
        const response = await createNovel(formData);
        if (!response.success) {
          setError(response.error || 'Failed to create novel');
          return;
        }
      }

      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !id || !novel) {
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${novel.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await deleteNovel(parseInt(id));
      if (response.success) {
        navigate('/admin');
      } else {
        setError(response.error || 'Failed to delete novel');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadFolder = () => {
    if (!isEditMode || !id) {
      return;
    }
    navigate(`/admin/novel/${id}/upload`);
  };

  if (loading) {
    return (
      <AdminLayout title={isEditMode ? 'Edit Novel' : 'Create Novel'}>
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-6">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditMode ? 'Edit Novel' : 'Create New Novel'}>
      <div className="max-w-3xl mx-auto">
         <form onSubmit={handleSubmit} className="space-y-6">
           {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-700">{error}</h3>
                </div>
              </div>
            </div>
           )}

           {isEditMode && novel?.cover_image_key && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              <div className="relative rounded-lg overflow-hidden border border-gray-200 max-w-sm">
                <img
                  src={getStorageUrl(novel.cover_image_key)}
                  alt={`${novel.title} cover`}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
           )}

           {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {novel?.cover_image_key ? 'Change Cover' : 'Upload Cover'}
              </label>
              <div>
                <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 transition-colors duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 1 6.373 1 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      Select Cover Image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
           )}

           <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              disabled={submitting}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter novel title"
            />
           </div>

           <div>
            <label
              htmlFor="author"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Author <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              required
              disabled={submitting}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter author name"
            />
           </div>

           <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              disabled={submitting}
              rows={6}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical"
              placeholder="Enter novel description"
            />
           </div>

            <div>
             <label
               htmlFor="category"
               className="block text-sm font-medium text-gray-700 mb-2"
             >
               Category <span className="text-red-500">*</span>
             </label>
             <select
               id="category"
               name="category"
               value={categories.includes(formData.category) ? formData.category : ''}
               onChange={handleInputChange}
               disabled={submitting}
               className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
             >
               <option value="">-- Select a category or type a new one below --</option>
               {categories.map(category => (
                 <option key={category} value={category}>
                   {category}
                 </option>
               ))}
             </select>
             <input
               type="text"
               id="category-custom"
               name="category"
               value={formData.category}
               onChange={handleInputChange}
               disabled={submitting}
               className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
               placeholder="Or enter a new category"
             />
            </div>

            <div>
             <fieldset>
               <legend className="block text-sm font-medium text-gray-700 mb-3">Status</legend>
               <div className="space-y-3 sm:space-y-0 sm:flex sm:space-x-6">
                 <label className="inline-flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                   <input
                     type="radio"
                     name="status"
                     checked={formData.status === 'ongoing'}
                     onChange={() => handleStatusChange('ongoing')}
                     disabled={submitting}
                     className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                   />
                   <span className="ml-3">
                     <span className="block text-sm font-medium text-gray-900">
                       Ongoing
                     </span>
                   </span>
                 </label>
                 <label className="inline-flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                   <input
                     type="radio"
                     name="status"
                     checked={formData.status === 'completed'}
                     onChange={() => handleStatusChange('completed')}
                     disabled={submitting}
                     className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                   />
                   <span className="ml-3">
                     <span className="block text-sm font-medium text-gray-900">
                       Completed
                     </span>
                   </span>
                 </label>
               </div>
             </fieldset>
            </div>

           <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
             <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 1 6.373 1 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isEditMode ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Save Changes' : 'Create Novel'}</>
              )}
             </button>

             {isEditMode && (
              <button
                type="button"
                onClick={handleUploadFolder}
                disabled={submitting}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Chapters
              </button>
             )}

             {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-6 py-3 border border-red-300 text-base font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-900 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                {deleting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-red-700"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 1 6.373 1 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete Novel
                  </>
                )}
              </button>
             )}

             <button
              type="button"
              onClick={() => navigate('/admin')}
              disabled={submitting || deleting}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
