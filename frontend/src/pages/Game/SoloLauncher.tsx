import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { Card } from '../../components/ui/Card';
import { RefreshCw } from 'lucide-react';

type ColorChoice = 'white' | 'black' | 'random';

export default function SoloLauncher() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ColorChoice>('white');

  const handleStart = () => {
    let color: 'white' | 'black';
    if (selected === 'random') {
      color = Math.random() < 0.5 ? 'white' : 'black';
    } else {
      color = selected;
    }
    navigate(`/solo-game?color=${color}`);
  };

const options: { value: ColorChoice; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'white',
      label: 'White',
      icon: (
        // Added responsive width/height
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-text-default/20 bg-[#f8f8f2] shadow-md" />
      ),
      description: 'White face the bottom of the board',
    },
    {
      value: 'black',
      label: 'Black',
      icon: (
        // Added responsive width/height
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-text-default/20 bg-[#1a1a2e] shadow-md" />
      ),
      description: 'Black faces the bottom of the board',
    },
    {
      value: 'random',
      label: 'Random',
      icon: (
        // Added responsive width/height, updated Lucide icon sizing
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-text-default/20 bg-accent/20 shadow-md flex items-center justify-center">
          <RefreshCw className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-accent" />
        </div>
      ),
      description: 'Pick a side at random',
    },
  ];

  return (
    <div className="mt-20 flex items-center justify-center p-4 font-body">
      <Card variant="surface" className="p-5 sm:p-8 flex flex-col items-center gap-6 sm:gap-8 max-w-md w-full">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-text-default mb-2">
            Solo Board
          </h1>
          <p className="text-sm text-text-default/60">
            Play both sides - perfect for analysis or study.
            <br />
            <span className="text-accent font-semibold">No clock · No premoves</span>
          </p>
        </div>

        {/* color picker */}
				<div className="w-full">
          <p className="text-xs font-semibold text-text-default/50 uppercase tracking-wider mb-3 text-center">
            Choose your board orientation
          </p>
          {/* Reduced gap to gap-2 on mobile, gap-3 on sm */}
          <div className="flex gap-2 sm:gap-3">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                // Reduced button padding and inner gap for mobile
                className={[
                  'flex-1 flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl border-2 transition-all duration-150',
                  selected === opt.value
                    ? 'border-accent bg-accent/10 shadow-md scale-[1.03]'
                    : 'border-text-default/10 hover:border-accent/40 hover:bg-accent/5',
                ].join(' ')}
                aria-pressed={selected === opt.value}
              >
                {opt.icon}
                {/* Made text slightly smaller on mobile to prevent wrapping */}
                <span className="text-xs sm:text-sm font-semibold text-text-default">{opt.label}</span>
              </button>
            ))}
          </div>
				</div>

        {/* actions */}
        <div className="flex gap-3 w-full">
          <Button
            variant="tertiary"
            onClick={() => navigate('/')}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="secondary"
            onClick={handleStart}
            className="flex-1"
          >
            Start
          </Button>
        </div>
      </Card>
    </div>
  );
}
