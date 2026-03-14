import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { Card } from '../../components/ui/Card';
import { RefreshCw } from 'lucide-react';

type ColorChoice = 'white' | 'black' | 'random';

export default function SoloLauncher() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Colorchoice>('white');

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
        <div className="w-12 h-12 rounded-full border-4-border-text-default/20 bg-[#f8f8f2] shadow-md" />
      ),
      description: 'White face the bottom of the board',
    },
    {
      value: 'black',
      label: 'Black',
      icon: (
        <div className="w-12 h-12 rounded-full border-4 border-text-default/20 bg-[#1a1a2e] shadow-md" />
      ),
      description: 'Black faces the bottom of the board',
    },
    {
      value: 'random',
      label: 'Random',
      icon: (
        <div className="w-12 h-12 rounded-full border-4 border-text-default/20 bg-accent/20 shadow-md flex items-center justify-center">
          <RefreshCw size={22} className="text-accent" />
        </div>
      ),
      description: 'Pick a side at random',
    },
  ];

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center p-4 font-body">
      <Card variant="surface" className="p-8 flex flex-col items-center gap-8 max-w-md w-full">

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
          <div className="flex gap-3">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={['flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-150',
                  selected === opt.value
                    ? 'border-accent bg-accent/10 shadow-md scale-[1.03]'
                    : 'border-text-default/10 hover:border-accent/40 hover:bg-accent/5',
                ].join(' ')}
                aria-pressed={selected === opt.value}
              >
                {opt.icon}
                <span className="text-sm font-semibold text-text-default">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-text-default/40 text-center mt-2">
            {options.find(o => o.value === selected)?.description}
          </p>
        </div>

        {/* actions */}
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="primary"
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
