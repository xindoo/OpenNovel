import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Trash2, Edit3, Upload, X, Save, Image as ImageIcon,
  AlertCircle, Check, FileText, LogOut, Loader2,
} from 'lucide-react';
import type { Novel } from '../api';
import {
  listNovelsAdmin, deleteNovel, createNovel, updateNovel,
  uploadCover, uploadSingleChapter, getStorageUrl,
  clearAdminCredentials,
} from '../api';

type Tab = 'novels' | 'edit' | 'upload';

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

export function AdminDashboard() {
  const navigate = useNavigate();

  // --- Novel list state ---
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  // --- Tab state ---
  const [activeTab, setActiveTab] = useState<Tab>('novels');

  // --- Edit state ---
  const [editId, setEditId] = useState<number | null>(null); // null = create mode
  const [form, setForm] = useState<NovelForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // --- Upload state ---
  const [uploadNovelId, setUploadNovelId] = useState<number | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [uploadFileStatuses, setUploadFileStatuses] = useState<Record<string, 'pending' | 'uploading' | 'done' | 'error'>>({});
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Load novels ---
  const loadNovels = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    const result = await listNovelsAdmin();
    if (result.success && result.data) {
      setNovels(result.data.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ));
    } else {
      setListError(result.error || '加载失败');
    }
    setLoadingList(false);
  }, []);

  useEffect(() => { loadNovels(); }, [loadNovels]);

  // --- Delete novel ---
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定要删除《${title}》吗？此操作不可撤销。`)) return;
    const result = await deleteNovel(id);
    if (result.success) {
      setNovels(prev => prev.filter(n => n.id !== id));
    } else {
      alert('删除失败: ' + (result.error || '未知错误'));
    }
  };

  // --- Open edit/create tab ---
  const openEdit = (novel?: Novel) => {
    setEditError('');
    setEditSuccess('');
    setCoverFile(null);
    if (novel) {
      setEditId(novel.id);
      setForm({
        title: novel.title,
        author: novel.author,
        description: novel.description || '',
        category: novel.category || '',
        status: novel.status || 'ongoing',
        cover_image_key: novel.cover_image_key || '',
      });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setActiveTab('edit');
  };

  // --- Save novel ---
  const handleSave = async () => {
    setSaving(true);
    setEditError('');
    setEditSuccess('');

    const data = {
      title: form.title,
      author: form.author,
      description: form.description,
      category: form.category,
      status: form.status as 'ongoing' | 'completed',
    };

    let result;
    if (editId) {
      result = await updateNovel(editId, data);
    } else {
      result = await createNovel(data as Omit<Novel, 'id' | 'created_at' | 'updated_at'>);
    }

    if (result.success && result.data) {
      const savedNovel = result.data;

      // Upload cover if selected
      if (coverFile) {
        const coverResult = await uploadCover(savedNovel.id, coverFile);
        if (coverResult.success && coverResult.data) {
          savedNovel.cover_image_key = coverResult.data.coverUrl;
        }
      }

      setEditSuccess(editId ? '更新成功' : '创建成功');
      await loadNovels();

      setTimeout(() => {
        setActiveTab('novels');
      }, 800);
    } else {
      setEditError(result.error || '保存失败');
    }

    setSaving(false);
  };

  // --- Open upload tab ---
  const openUpload = (novelId: number) => {
    setUploadNovelId(novelId);
    setUploadFiles([]);
    setUploadError('');
    setUploadSuccess('');
    setActiveTab('upload');
  };

  // --- Handle file drop/select ---
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith('.txt') || f.name.endsWith('.md')
    );
    setUploadFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadFiles(prev => [...prev, ...files]);
    }
  };

  // --- Upload chapters ---
  const handleUpload = async () => {
    if (!uploadNovelId || uploadFiles.length === 0) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const sortedFiles = [...uploadFiles].sort((a, b) => a.name.localeCompare(b.name));
    const total = sortedFiles.length;
    setUploadProgress({ completed: 0, total });

    const initialStatuses: Record<string, 'pending' | 'uploading' | 'done' | 'error'> = {};
    sortedFiles.forEach(f => { initialStatuses[f.name] = 'pending'; });
    setUploadFileStatuses(initialStatuses);

    let errorCount = 0;
    let completedCount = 0;

    for (const file of sortedFiles) {
      setUploadFileStatuses(prev => ({ ...prev, [file.name]: 'uploading' }));

      const result = await uploadSingleChapter(uploadNovelId, file);

      if (result.success) {
        completedCount++;
        setUploadFileStatuses(prev => ({ ...prev, [file.name]: 'done' }));
      } else {
        errorCount++;
        setUploadFileStatuses(prev => ({ ...prev, [file.name]: 'error' }));
      }

      setUploadProgress({ completed: completedCount + errorCount, total });
    }

    if (errorCount === 0) {
      setUploadSuccess(`成功上传 ${total} 个章节`);
      setUploadFiles([]);
    } else {
      setUploadError(`上传完成，${total - errorCount} 个成功，${errorCount} 个失败`);
    }

    await loadNovels();
    setUploading(false);
  };

  // --- Logout ---
  const handleLogout = () => {
    clearAdminCredentials();
    navigate('/admin/login');
  };

  const selectedNovel = novels.find(n => n.id === (activeTab === 'upload' ? uploadNovelId : editId));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-purple-500" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">管理后台</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出
        </button>
      </div>

      {/* Tab bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6">
        <div className="flex gap-1">
          {([
            { key: 'novels' as Tab, label: '小说列表', icon: BookOpen },
            { key: 'edit' as Tab, label: editId ? '编辑小说' : '新建小说', icon: editId ? Edit3 : Plus },
            { key: 'upload' as Tab, label: '上传章节', icon: Upload },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'edit' && activeTab !== 'edit') openEdit();
                else if (tab.key === 'upload' && activeTab !== 'upload') {
                  if (novels.length > 0) openUpload(novels[0].id);
                }
                else setActiveTab(tab.key);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {/* ===== NOVELS LIST TAB ===== */}
          {activeTab === 'novels' && (
            <motion.div key="novels" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">共 {novels.length} 部小说</p>
                <button
                  onClick={() => openEdit()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新建小说
                </button>
              </div>

              {loadingList ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              ) : listError ? (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm">{listError}</p>
                </div>
              ) : novels.length === 0 ? (
                <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>暂无小说</p>
                  <p className="text-sm mt-1">点击上方按钮创建第一部</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {novels.map(novel => (
                    <div
                      key={novel.id}
                      className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
                    >
                      {novel.cover_image_key ? (
                        <img
                          src={getStorageUrl(novel.cover_image_key)}
                          alt={novel.title}
                          className="w-12 h-16 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg shrink-0 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white/80" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{novel.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{novel.author}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex flex-wrap gap-1">
                            {(novel.category || '未分类').split(/[,，]/).map((tag, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full whitespace-nowrap">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                          <span className={`text-xs px-2 py-0.5 whitespace-nowrap rounded-full ${
                            novel.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}>
                            {novel.status === 'completed' ? '已完结' : '连载中'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openUpload(novel.id)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="上传章节"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(novel)}
                          className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(novel.id, novel.title)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== EDIT/CREATE TAB ===== */}
          {activeTab === 'edit' && (
            <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                {editId ? `编辑《${selectedNovel?.title || ''}》` : '创建新小说'}
              </h2>

              {editError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm">{editError}</p>
                </div>
              )}
              {editSuccess && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-4">
                  <Check className="w-4 h-4 shrink-0" />
                  <p className="text-sm">{editSuccess}</p>
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
                    onClick={() => setActiveTab('novels')}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.title || !form.author}
                    className="flex items-center gap-1.5 px-5 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editId ? '保存修改' : '创建小说'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== UPLOAD TAB ===== */}
          {activeTab === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">上传章节</h2>

              {uploadError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm">{uploadError}</p>
                </div>
              )}
              {uploadSuccess && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-4">
                  <Check className="w-4 h-4 shrink-0" />
                  <p className="text-sm">{uploadSuccess}</p>
                </div>
              )}

              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-5">
                {/* Novel selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">选择小说 *</label>
                  <select
                    value={uploadNovelId ?? ''}
                    onChange={(e) => setUploadNovelId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">请选择...</option>
                    {novels.map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                    isDragging
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <Upload className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    拖拽 .txt / .md 文件到此处
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">文件按名称排序作为章节顺序</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    选择文件
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* File list */}
                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        已选 {uploadFiles.length} 个文件
                      </p>
                      {!uploading && (
                        <button
                          onClick={() => setUploadFiles([])}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          清空
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                      {[...uploadFiles].sort((a, b) => a.name.localeCompare(b.name)).map((file, i) => {
                        const status = uploadFileStatuses[file.name] || 'pending';
                        return (
                          <div key={`${file.name}-${i}`} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{file.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                            {uploading && status === 'uploading' && (
                              <Loader2 className="w-4 h-4 text-purple-500 animate-spin shrink-0" />
                            )}
                            {uploading && status === 'done' && (
                              <Check className="w-4 h-4 text-green-500 shrink-0" />
                            )}
                            {uploading && status === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            )}
                            {!uploading && (
                              <button
                                onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {uploading && uploadProgress.total > 0 && (
                  <div className="space-y-1.5">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(uploadProgress.completed / uploadProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      已完成 {uploadProgress.completed}/{uploadProgress.total}
                    </p>
                  </div>
                )}

                {/* Upload button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('novels')}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !uploadNovelId || uploadFiles.length === 0}
                    className="flex items-center gap-1.5 px-5 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading && uploadProgress.total > 0 ? `已完成 ${uploadProgress.completed}/${uploadProgress.total}` : '上传'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
