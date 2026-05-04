import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, X, FileText, AlertCircle, Check, Loader2,
} from 'lucide-react';
import { uploadSingleChapter } from '../../api';

interface UploadTabProps {
  novelId: number;
  onUploadComplete?: () => void;
}

export function UploadTab({ novelId, onUploadComplete }: UploadTabProps) {
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [uploadFileStatuses, setUploadFileStatuses] = useState<Record<string, 'pending' | 'uploading' | 'done' | 'error'>>({});
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
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

      const result = await uploadSingleChapter(novelId, file);

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
      onUploadComplete?.();
    } else {
      setUploadError(`上传完成，${total - errorCount} 个成功，${errorCount} 个失败`);
    }

    setUploading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
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
            onClick={handleUpload}
            disabled={uploading || uploadFiles.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading && uploadProgress.total > 0 ? `已完成 ${uploadProgress.completed}/${uploadProgress.total}` : '上传'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
