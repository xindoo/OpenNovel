import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCharacterProps {
  className?: string;
}

export function AnimatedCharacter({ className = '' }: AnimatedCharacterProps) {
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const maxOffset = 4;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = Math.min(dist / 200, 1);
      setEyeOffset({
        x: (dx / (dist || 1)) * maxOffset * factor,
        y: (dy / (dist || 1)) * maxOffset * factor,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Body */}
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700 shadow-lg flex items-center justify-center relative">
        {/* Face */}
        <div className="flex gap-4 mb-2">
          {/* Left eye */}
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <div
              className="w-2.5 h-2.5 bg-gray-800 rounded-full transition-transform duration-100"
              style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
            />
          </div>
          {/* Right eye */}
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <div
              className="w-2.5 h-2.5 bg-gray-800 rounded-full transition-transform duration-100"
              style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
            />
          </div>
        </div>
        {/* Mouth */}
        <div className="absolute bottom-8 w-6 h-3 border-b-2 border-purple-800 dark:border-purple-200 rounded-b-full" />
      </div>
      {/* Arms */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-10 bg-purple-500 dark:bg-purple-600 rounded-full -rotate-12" />
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-10 bg-purple-500 dark:bg-purple-600 rounded-full rotate-12" />
    </motion.div>
  );
}
