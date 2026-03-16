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
      // Auto-scroll logic for both vertical (desktop) and horizontal (mobile)
      el.scrollTop = el.scrollHeight;
      el.scrollLeft = el.scrollWidth;
    }
  }, [history]);

  const pairs: { n: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ n: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div 
      ref={containerRef} 
      // Mobile: flex-row (horizontal scroll) | Desktop: flex-col (vertical scroll)
      className="flex flex-row lg:flex-col gap-1.5 w-full h-full overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar pb-2 lg:pb-0"
    >
      {pairs.length === 0 ? (
        <div className="flex items-center justify-center w-full h-full text-text-default/50 text-sm font-body italic min-h-[40px]">
          No moves yet
        </div>
      ) : (
        pairs.map(({ n, white, black }) => (
          <div 
            key={n} 
            className="flex items-center shrink-0 lg:shrink py-1.5 px-2 rounded-md hover:bg-accent/10 bg-primary/5 lg:bg-transparent border border-accent/10 lg:border-transparent transition-colors duration-100"
          >
            <span className="w-6 text-text-default/50 font-body text-xs select-none text-right pr-2">
              {n}.
            </span>
            <span className="w-12 lg:w-16 font-semibold text-text-default text-sm">
              {white}
            </span>
            <span className="w-12 lg:w-16 font-semibold text-text-default text-sm">
              {black ?? ''}
            </span>
          </div>
        ))
      )}
    </div>
  );
};