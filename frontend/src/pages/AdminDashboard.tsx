import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Trash2, LogOut, Loader2, AlertCircle,
} from 'lucide-react';
import type { Novel } from '../api';
import { listNovelsAdmin, deleteNovel, getStorageUrl, clearAdminCredentials } from '../api';

export function AdminDashboard() {
  const navigate = useNavigate();

  const [novels, setNovels] = useState<Novel[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

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

  const handleDelete = async (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation();
    if (!confirm(`确定要删除《${title}》吗？此操作不可撤销。`)) return;
    const result = await deleteNovel(id);
    if (result.success) {
      setNovels(prev => prev.filter(n => n.id !== id));
    } else {
      alert('删除失败: ' + (result.error || '未知错误'));
    }
  };

  const handleLogout = () => {
    clearAdminCredentials();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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

      <div className="max-w-5xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">共 {novels.length} 部小说</p>
            <button
              onClick={() => navigate('/admin/novel/new')}
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
                  onClick={() => navigate(`/admin/novel/${novel.id}`)}
                  className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow cursor-pointer"
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
                  <button
                    onClick={(e) => handleDelete(e, novel.id, novel.title)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
