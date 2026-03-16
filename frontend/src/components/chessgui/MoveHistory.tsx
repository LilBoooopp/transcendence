// frontend/src/components/chessgui/MoveHistory.tsx
import React, { useEffect, useRef } from 'react';

interface MoveHistoryProps {
  history: string[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ history }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      // Auto-scroll logic for vertical scrolling only
      el.scrollTop = el.scrollHeight;
    }
  }, [history]);

  const pairs: { n: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ n: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div 
      ref={containerRef} 
      // Mobile: 2 columns (2 rounds per row) | Desktop: 1 column
      // align-content-start ensures the items pack at the top instead of spacing out vertically
      className="grid grid-cols-3 lg:grid-cols-1 gap-x-2 gap-y-1 w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 content-start"
    >
      {pairs.length === 0 ? (
        <div className="col-span-2 lg:col-span-1 flex items-center justify-center w-full h-full text-text-default/50 text-sm font-body italic min-h-[40px]">
          No moves yet
        </div>
      ) : (
        pairs.map(({ n, white, black }) => (
          <div 
            key={n} 
            className="flex items-center py-1.5 px-2 rounded-md hover:bg-accent/10 bg-primary/5 lg:bg-transparent border border-accent/10 lg:border-transparent transition-colors duration-100"
          >
            <span className="w-5 sm:w-6 text-text-default/50 font-body text-[10px] sm:text-xs select-none text-right pr-1.5 sm:pr-2 shrink-0">
              {n}.
            </span>
            <span className="w-10 sm:w-12 lg:w-16 font-semibold text-text-default text-xs sm:text-sm truncate">
              {white}
            </span>
            <span className="w-10 sm:w-12 lg:w-16 font-semibold text-text-default text-xs sm:text-sm truncate">
              {black ?? ''}
            </span>
          </div>
        ))
      )}
    </div>
  );
};