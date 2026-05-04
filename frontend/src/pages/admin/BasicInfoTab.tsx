import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon, AlertCircle, Check, Save, Loader2,
} from 'lucide-react';
import type { Novel } from '../../api';
import {
  listNovelsAdmin, createNovel, updateNovel, uploadCover, getStorageUrl,
} from '../../api';

interface NovelForm {
  title: string;
  author: string;
  description: string;
  category: string;
  status: string;
  cover_image_key: string;
}

const emptyForm: NovelForm = {
  title: '', author: '', description: '', category: '', status: 'ongoing', cover_image_key: '',
};

interface BasicInfoTabProps {
  novelId: number | null;   // null = create mode, number = edit mode
  onSaved: (novel: Novel) => void;
}

export function BasicInfoTab({ novelId, onSaved }: BasicInfoTabProps) {
  const [form, setForm] = useState<NovelForm>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [novelTitle, setNovelTitle] = useState('');

  const isCreateMode = novelId === null;

  useEffect(() => {
    if (novelId !== null) {
      setCoverFile(null);
      setError('');
      setSuccess('');
      listNovelsAdmin().then(result => {
        if (result.success && result.data) {
          const novel = result.data.find(n => n.id === novelId);
          if (novel) {
            setNovelTitle(novel.title);
            setForm({
              title: novel.title,
              author: novel.author,
              description: novel.description || '',
              category: novel.category || '',
              status: novel.status || 'ongoing',
              cover_image_key: novel.cover_image_key || '',
            });
          } else {
            setError('未找到该小说');
          }
        } else {
          setError(result.error || '加载小说信息失败');
        }
      });
    } else {
      setForm(emptyForm);
      setCoverFile(null);
      setError('');
      setSuccess('');
      setNovelTitle('');
    }
  }, [novelId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const data = {
      title: form.title,
      author: form.author,
      description: form.description,
      category: form.category,
      status: form.status as 'ongoing' | 'completed',
    };

    let result;
    if (!isCreateMode && novelId !== null) {
      result = await updateNovel(novelId, data);
    } else {
      result = await createNovel(data as Omit<Novel, 'id' | 'created_at' | 'updated_at'>);
    }

    if (result.success && result.data) {
      const savedNovel = result.data;

      if (coverFile) {
        const coverResult = await uploadCover(savedNovel.id, coverFile);
        if (coverResult.success && coverResult.data) {
          savedNovel.cover_image_key = coverResult.data.coverUrl;
        }
      }

      setSuccess(isCreateMode ? '创建成功' : '更新成功');
      onSaved(savedNovel);
    } else {
      setError(result.error || '保存失败');
    }

    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
        {isCreateMode ? '创建新小说' : `编辑《${novelTitle}》`}
      </h2>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-4">
          <Check className="w-4 h-4 shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-5">
        {/* Cover upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">封面</label>
          <div className="flex items-start gap-4">
            <div className="w-24 h-32 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 shrink-0">
              {coverFile ? (
                <img src={URL.createObjectURL(coverFile)} alt="preview" className="w-full h-full object-cover" />
              ) : form.cover_image_key ? (
                <img src={getStorageUrl(form.cover_image_key)} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-300"
              />
              <p className="text-xs text-gray-400 mt-1.5">支持 JPG/PNG，建议 3:4 比例</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">标题 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="小说标题"
            required
          />
        </div>

        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">作者 *</label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => setForm(p => ({ ...p, author: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="作者名"
            required
          />
        </div>

        {/* Category + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">分类</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
              placeholder="多个标签用英文逗号分隔，如：玄幻,热血"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">状态</label>
            <select
              value={form.status}
              onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="ongoing">连载中</option>
              <option value="completed">已完结</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">简介</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="小说简介..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !form.title || !form.author}
            className="flex items-center gap-1.5 px-5 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isCreateMode ? '创建小说' : '保存修改'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
