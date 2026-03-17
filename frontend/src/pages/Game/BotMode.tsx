import React from 'react';
import { useNavigate } from 'react-router-dom';
import Tile from '../../components/Tile';
import * as Icons from 'lucide-react';
import { isLoggedIn } from '../../services/auth.service';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: {
  difficulty: Difficulty;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
    {
      difficulty: 'easy',
      title: 'Easy',
      description: 'Perfect for beginners. The bot makes occasional mistakes.',
      icon: <Icons.Smile size={36} />,
    },
    {
      difficulty: 'medium',
      title: 'Medium',
      description: 'A solid challenge. Plays consistently and punishes blunders.',
      icon: <Icons.Brain size={36} />,
    },
    {
      difficulty: 'hard',
      title: 'Hard',
      description: 'Near-engine strength. Only for the brave.',
      icon: <Icons.Flame size={36} />,
    },
  ];

export default function WireframeBotMode() {
  const navigate = useNavigate();

  const handleSelect = (difficulty: Difficulty) => {
    //Check if the user is still logged (can't navigate the matching page without token)
    isLoggedIn().then(({ connected }) => {
      if (!connected) {
        navigate('/');
        return;
      }
    });
    const mm_token = crypto.randomUUID();
    sessionStorage.setItem('mm_flow', JSON.stringify({ mm_token, tcKey: "600%2B0", ts: Date.now() }))
    navigate(`/bot-launch?difficulty=${difficulty}&tc-600%2B0`, {
      state: { fromBotMode: true, mm_token }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 max-w-5xl mx-auto py-12">
      <h1 className="text-4xl font-heading font-bold mb-4 text-center">
        Play vs AI
      </h1>
      <p className="text-text-dark/60 font-body mb-12 text-center">
        Choose your difficulty level
      </p>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
	{DIFFICULTIES.map(({ difficulty, title, description, icon }) => (
          <Tile
            key={difficulty}
            title={title}
            description={description}
            icon={icon}
            onClick={() => handleSelect(difficulty)}
          />
        ))}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-10 text-sm text-text-dark/50 hover:text-text-dark transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}
