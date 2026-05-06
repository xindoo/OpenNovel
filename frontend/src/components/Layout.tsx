import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useTheme } from '../hooks/useTheme';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toggleTheme, isDark } = useTheme();

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <>
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        onToggleTheme={toggleTheme}
        isDark={isDark}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="pt-14 min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
