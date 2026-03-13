import React, { useEffect, useRef } from 'react';

interface MoveHistoryProps {
  history: string[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ history }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [history]);

  const pairs: { n: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ n: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto min-h-0">
      {pairs.length === 0 ? (
        <div className="flex items-center justify-center h-full text-text-dark/30 text-sm font-body italic">
          No moves yet
        </div>
      ) : (
        <table className="w-full text-sm font-mono">
          <tbody>
            {pairs.map(({ n, white, black }) => (
              <tr key={n} className="group hover:bg-accent/20 transition-colors duration-100">
                <td className="w-8 pl-3 py-0.5 text-text-dark/40 font-body text-xs select-none">{n}</td>
                <td className="w-1/2 py-0.5 pr-3 font-semibold text-text-dark cursor-pointer hover:text-primary transition-colors">
                  {white}
                </td>
                <td className="w-1/2 py-0.5 pr-3 font-semibold text-text-dark cursor-pointer hover:text-primary transition-colors">
                  {black ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
