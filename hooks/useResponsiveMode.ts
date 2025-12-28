'use client';

import { useEffect, useMemo, useState } from 'react';
import { getResponsiveMode, type ResponsiveMode } from '@/lib/utils/responsive';

export interface ResponsiveInfo {
  mode: ResponsiveMode;
  width: number;
}

export function useResponsiveMode(): ResponsiveInfo {
  const [width, setWidth] = useState<number>(() => (typeof window === 'undefined' ? 1024 : window.innerWidth));

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const mode = useMemo(() => getResponsiveMode(width), [width]);

  return { mode, width };
}
