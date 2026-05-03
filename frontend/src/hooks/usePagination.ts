import { useMemo, useRef, useEffect, useState, useCallback } from 'react';

interface UsePaginationOptions {
  content: string;
  containerWidth: number;
  containerHeight: number;
  fontSize: number;
  lineHeight?: number;
}

interface UsePaginationResult {
  pages: string[];
  totalPages: number;
  recalculate: () => void;
}

export function usePagination({
  content,
  containerWidth,
  containerHeight,
  fontSize,
  lineHeight = 1.8,
}: UsePaginationOptions): UsePaginationResult {
  const measurerRef = useRef<HTMLDivElement | null>(null);
  const [measurerReady, setMeasurerReady] = useState(false);
  const [resizeKey, setResizeKey] = useState(0);

  const recalculate = useCallback(() => {
    setResizeKey(k => k + 1);
  }, []);

  useEffect(() => {
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.pointerEvents = 'none';
    document.body.appendChild(measurer);
    measurerRef.current = measurer;
    setMeasurerReady(true);

    return () => {
      if (measurer.parentNode) {
        document.body.removeChild(measurer);
      }
      measurerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setResizeKey(k => k + 1), 200);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);

  const pages = useMemo(() => {
    if (!content) {
      return ['加载中...'];
    }
    if (!measurerRef.current || !measurerReady || containerWidth <= 0 || containerHeight <= 0) {
      return [content];
    }

    const measurer = measurerRef.current;
    measurer.style.whiteSpace = 'pre-wrap';
    measurer.style.wordBreak = 'break-words';
    measurer.style.lineHeight = String(lineHeight);
    measurer.style.fontSize = `${fontSize}px`;
    measurer.style.width = `${containerWidth}px`;

    const paragraphs = content.split('\n\n');
    const result: string[] = [];
    let currentPageParagraphs: string[] = [];
    let currentHeight = 0;
    const verticalPadding = 64;
    const availableHeight = containerHeight - verticalPadding;
    const blankLineHeight = fontSize * lineHeight;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      measurer.textContent = para;
      const paraHeight = measurer.offsetHeight;
      const heightNeeded = i === 0 ? paraHeight : blankLineHeight + paraHeight;

      if (currentHeight + heightNeeded > availableHeight && currentPageParagraphs.length > 0) {
        result.push(currentPageParagraphs.join('\n\n'));
        currentPageParagraphs = [para];
        currentHeight = paraHeight;
      } else {
        currentPageParagraphs.push(para);
        currentHeight += heightNeeded;
      }
    }

    if (currentPageParagraphs.length > 0) {
      result.push(currentPageParagraphs.join('\n\n'));
    }

    return result.length > 0 ? result : [''];
  }, [content, containerWidth, containerHeight, fontSize, lineHeight, measurerReady, resizeKey]);

  return {
    pages,
    totalPages: pages.length,
    recalculate,
  };
}
