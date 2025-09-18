import { useEffect, useRef, useState, useCallback } from 'react';

export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef<number>();

  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();

    return () => {
      if (startTime.current) {
        const endTime = performance.now();
        const renderTime = endTime - startTime.current;
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
          
          // Warn about slow renders
          if (renderTime > 16) {
            console.warn(`⚠️ ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
          }
        }
      }
    };
  });

  return renderCount.current;
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T => {
  return useCallback(callback, dependencies);
};
