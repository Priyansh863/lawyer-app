import { memo } from 'react';

interface OptimizedLoadingProps {
  className?: string;
  rows?: number;
  height?: number;
}

const OptimizedLoading = memo(({ className = '', rows = 5, height = 60 }: OptimizedLoadingProps) => {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {Array.from({ length: rows }, (_, index) => (
        <div 
          key={index} 
          className="bg-gray-200 rounded"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
});

OptimizedLoading.displayName = 'OptimizedLoading';

export default OptimizedLoading;
