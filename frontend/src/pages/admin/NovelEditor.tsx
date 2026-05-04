import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Edit3, Upload, FileText, LogOut, ArrowLeft, Loader2,
} from 'lucide-react';
import type { Novel } from '../../api';
import { listNovelsAdmin, clearAdminCredentials } from '../../api';
import { BasicInfoTab } from './BasicInfoTab';
import { UploadTab } from './UploadTab';
import { ChapterEditor } from './ChapterEditor';

type EditorTab = 'info' | 'upload' | 'chapters';

const tabs: { key: EditorTab; label: string; icon: typeof Edit3 }[] = [
  { key: 'info', label: '基本信息', icon: Edit3 },
  { key: 'upload', label: '上传章节', icon: Upload },
  { key: 'chapters', label: '章节管理', icon: FileText },
];

export function NovelEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const novelId = isNew ? null : Number(id);

  const [activeTab, setActiveTab] = useState<EditorTab>('info');
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isNew && novelId) {
      setLoading(true);
      setNotFound(false);
      listNovelsAdmin().then(result => {
        if (result.success && result.data) {
          const found = result.data.find(n => n.id === novelId);
          if (found) {
            setNovel(found);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
    }
  }, [novelId, isNew]);

  const handleNovelSaved = (saved: Novel) => {
    if (isNew) {
      navigate(`/admin/novel/${saved.id}`, { replace: true });
    } else {
      setNovel(saved);
    }
  };

  const handleSwitchToUpload = () => setActiveTab('upload');

  const handleLogout = () => {
    clearAdminCredentials();
    navigate('/admin/login');
  };

  const handleTabClick = (key: EditorTab) => {
    if (isNew && key !== 'info') return;
    setActiveTab(key);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
        <BookOpen className="w-12 h-12 mb-3 opacity-40" />
        <p>未找到该小说</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 text-sm text-purple-500 hover:text-purple-600 transition-colors"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-md">
              {isNew ? '新建小说' : novel?.title || ''}
            </h1>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6">
        <div className="flex gap-1">
          {tabs.map(tab => {
            const disabled = isNew && tab.key !== 'info';
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : disabled
                      ? 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <BasicInfoTab novelId={novelId} onSaved={handleNovelSaved} />
            </motion.div>
          )}
          {activeTab === 'upload' && novelId && (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <UploadTab novelId={novelId} />
            </motion.div>
          )}
          {activeTab === 'chapters' && novelId && (
            <motion.div key="chapters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ChapterEditor novelId={novelId} onSwitchToUpload={handleSwitchToUpload} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
