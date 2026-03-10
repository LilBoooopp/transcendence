export interface TimeControl {
  key: string;
  label: string;
  initialMs: number;
  incrementMs: number;
  category: 'bullet' | 'blitz' | 'rapid';
}

export const TIME_CONTROLS: TimeControl[] = [
  { key: '60+0', label: '1 min', initialMs: 60_000, incrementMs: 0, category: 'bullet' },
  { key: '60+1', label: '1 | 1', initialMs: 60_000, incrementMs: 1_000, category: 'bullet' },
  { key: '120+1', label: '2 | 1', initialMs: 120_000, incrementMs: 1_000, category: 'bullet' },

  { key: '180+0', label: '3 min', initialMs: 180_000, incrementMs: 0, category: 'blitz' },
  { key: '180+2', label: '3 | 2', initialMs: 180_000, incrementMs: 2_000, category: 'blitz' },
  { key: '300+0', label: '5 min', initialMs: 300_000, incrementMs: 0, category: 'blitz' },
  { key: '300+3', label: '5 | 3', initialMs: 3_000, incrementMs: 3_000, category: 'blitz' },

  { key: '600+0', label: '10 min', initialMs: 600_000, incrementMs: 0, category: 'rapid' },
  { key: '900+10', label: '15 | 10', initialMs: 900_000, incrementMs: 10_000, category: 'rapid' },
  { key: '1800+0', label: '30 min', initialMs: 1_800_000, incrementMs: 0, category: 'rapid' },
];

export function parseTimeControl(key: string): Pick<TimeControl, 'initialMs' | 'incrementMs'> | null {
  const parts = key.split('+');
  if (parts.length !== 2) return (null);
  const [secs, inc] = parts.map(Number);
  if (isNaN(secs) || isNaN(inc)) return (null);
  return ({ initialMs: secs * 1_000, incrementMs: inc * 1_000 });
}

export function getTimeControl(key: string): TimeControl {
  return (TIME_CONTROLS.find(tc => tc.key === key) ?? TIME_CONTROLS[7]); // default to 10 mins
}
