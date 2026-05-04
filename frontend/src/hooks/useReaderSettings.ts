import { useState, useCallback, useEffect } from 'react';

export type ReadingMode = 'page' | 'scroll';

export interface ReaderSettings {
  readingMode: ReadingMode;
  fontSizeIdx: number;
  themeIdx: number;
}

const STORAGE_KEY = 'opennovel-reader-settings';
const OLD_READING_MODE_KEY = 'opennovel-reading-mode';
const OLD_THEME_KEY = 'opennovel-reader-theme';

const DEFAULT_SETTINGS: ReaderSettings = {
  readingMode: 'page',
  fontSizeIdx: 1,
  themeIdx: 0,
};

// Migration-only: must match THEMES[].name order in ReaderOverlay.tsx
const THEME_NAMES = ['default', 'sepia', 'green', 'dark'];

function loadReaderSettings(): ReaderSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }

    let settings = { ...DEFAULT_SETTINGS };
    let migrated = false;

    const oldMode = localStorage.getItem(OLD_READING_MODE_KEY);
    if (oldMode === 'scroll' || oldMode === 'page') {
      settings.readingMode = oldMode;
      migrated = true;
    }

    const oldTheme = localStorage.getItem(OLD_THEME_KEY);
    if (oldTheme) {
      const idx = THEME_NAMES.indexOf(oldTheme);
      if (idx >= 0) {
        settings.themeIdx = idx;
        migrated = true;
      }
    }

    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      localStorage.removeItem(OLD_READING_MODE_KEY);
      localStorage.removeItem(OLD_THEME_KEY);
    }

    return settings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveReaderSettings(settings: ReaderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(loadReaderSettings);

  useEffect(() => {
    saveReaderSettings(settings);
  }, [settings]);

  const setReadingMode = useCallback((mode: ReadingMode) => {
    setSettings(prev => ({ ...prev, readingMode: mode }));
  }, []);

  const setFontSizeIdx = useCallback((idx: number) => {
    setSettings(prev => ({ ...prev, fontSizeIdx: idx }));
  }, []);

  const setThemeIdx = useCallback((idx: number) => {
    setSettings(prev => ({ ...prev, themeIdx: idx }));
  }, []);

  return {
    settings,
    setReadingMode,
    setFontSizeIdx,
    setThemeIdx,
  };
}
