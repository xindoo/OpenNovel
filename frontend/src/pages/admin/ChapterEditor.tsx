import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Save, Trash2, Loader2, AlertCircle, Check, Upload,
} from 'lucide-react';
import type { Novel, Chapter } from '../../api';
import { getNovel, getChapter, updateChapter, deleteChapter } from '../../api';

interface ChapterEditorProps {
  novels: Novel[];
  onUploadClick: (novelId: number) => void;
}

export function ChapterEditor({ novels, onUploadClick }: ChapterEditorProps) {
  const [selectedNovelId, setSelectedNovelId] = useState<number | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');

  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadChapters = useCallback(async (novelId: number) => {
    setLoadingChapters(true);
    setError('');
    setChapters([]);
    setSelectedChapterId(null);
    setChapterTitle('');
    setChapterContent('');

    const result = await getNovel(novelId);
    if (result.success && result.data) {
      setChapters(result.data.chapters || []);
    } else {
      setError(result.error || '加载章节列表失败');
    }
    setLoadingChapters(false);
  }, []);

  useEffect(() => {
    if (selectedNovelId !== null) {
      loadChapters(selectedNovelId);
    }
  }, [selectedNovelId, loadChapters]);

  const loadChapterContent = useCallback(async (novelId: number, chapterId: number) => {
    setLoadingContent(true);
    setError('');
    setChapterTitle('');
    setChapterContent('');

    const result = await getChapter(novelId, chapterId);
    if (result.success && result.data) {
      setChapterTitle(result.data.chapter.title || '');
      setChapterContent(result.data.content || '');
    } else {
      setError(result.error || '加载章节内容失败');
    }
    setLoadingContent(false);
  }, []);

  const handleNovelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novelId = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedNovelId(novelId);
  };

  const handleChapterClick = (chapter: Chapter) => {
    if (selectedNovelId === null) return;
    setSelectedChapterId(chapter.id);
    loadChapterContent(selectedNovelId, chapter.id);
  };

  const handleSave = async () => {
    if (selectedNovelId === null || selectedChapterId === null) return;
    setSaving(true);
    setError('');
    setSuccess('');

    const result = await updateChapter(selectedNovelId, selectedChapterId, {
      title: chapterTitle,
      content: chapterContent,
    });

    if (result.success) {
      setSuccess('保存成功');
      await loadChapters(selectedNovelId);
    } else {
      setError(result.error || '保存失败');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (selectedNovelId === null || selectedChapterId === null) return;
    if (!confirm('确定要删除此章节吗？此操作不可撤销。')) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    const result = await deleteChapter(selectedNovelId, selectedChapterId);

    if (result.success) {
      setSuccess('删除成功');
      setSelectedChapterId(null);
      setChapterTitle('');
      setChapterContent('');
      await loadChapters(selectedNovelId);
    } else {
      setError(result.error || '删除失败');
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">章节编辑</h2>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          选择小说
        </label>
        <select
          value={selectedNovelId ?? ''}
          onChange={handleNovelChange}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        >
          <option value="">请选择小说</option>
          {novels.map(novel => (
            <option key={novel.id} value={novel.id}>
              {novel.title}
            </option>
          ))}
        </select>
      </div>

      {selectedNovelId === null && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <FileText className="w-12 h-12 mb-3 opacity-40" />
          <p>请选择小说</p>
        </div>
      )}

      {selectedNovelId !== null && (
        <div className="flex gap-4">
          <div className="w-1/3 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">章节列表</h3>
              <button
                onClick={() => onUploadClick(selectedNovelId)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
              >
                <Upload className="w-3 h-3" />
                上传
              </button>
            </div>

            {loadingChapters ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ) : chapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                <FileText className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">暂无章节</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {chapters.map(chapter => (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterClick(chapter)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedChapterId === chapter.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {chapter.title || `第${chapter.chapter_number}章`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-2/3 space-y-4">
            {selectedChapterId === null && (
              <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500">
                <FileText className="w-12 h-12 mb-3 opacity-40" />
                <p>请选择章节</p>
              </div>
            )}

            {selectedChapterId !== null && (
              <>
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
                    <Check className="w-4 h-4 shrink-0" />
                    <p className="text-sm">{success}</p>
                  </div>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      章节标题
                    </label>
                    <input
                      type="text"
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      disabled={loadingContent}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                      placeholder="章节标题"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      章节内容
                    </label>
                    {loadingContent ? (
                      <div className="flex items-center justify-center h-96">
                        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                      </div>
                    ) : (
                      <textarea
                        value={chapterContent}
                        onChange={(e) => setChapterContent(e.target.value)}
                        rows={20}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y min-h-96"
                        placeholder="章节内容..."
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      删除章节
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || loadingContent}
                      className="flex items-center gap-1.5 px-5 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      保存修改
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}