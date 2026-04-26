import { useNavigate } from 'react-router-dom';
import { Menu, BookOpen, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export function Header({ onMenuClick, onToggleTheme, isDark }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="h-full flex items-center justify-between px-4 max-w-7xl mx-auto">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="打开菜单"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
          <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            OpenNovel
          </span>
        </button>

        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label={isDark ? '切换亮色模式' : '切换暗色模式'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
