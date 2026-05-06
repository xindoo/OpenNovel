export function Footer() {
  return (
    <footer className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span>&copy; 2026 OpenNovel by </span>
          <a
            href="https://zxs.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            xindoo
          </a>
        </div>
        <div className="flex items-center gap-1">
          <span>邮箱:</span>
          <a
            href="mailto:xindoo@qq.com"
            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            xindoo@qq.com
          </a>
        </div>
      </div>
    </footer>
  );
}
