import React from 'react';
import Button from '../Button';
import { X } from 'lucide-react';

interface GameEndPopupProps {
	status: string;
	onHome: () => void;
	onNewGame: () => void;
	onClose: () => void;
}

const GameEndPopup: React.FC<GameEndPopupProps> = ({ status, onHome, onNewGame, onClose }) => {
	return (
		<div className="fixed inset-0 bg-background-light/80 backdrop-blur-sm z-50 flex items-center justify-center font-body">
			{/* Reusing the styling from your GamePage waiting screen */}
			<div className="bg-white rounded-2xl shadow-xl border border-accent/30 p-10 text-center flex flex-col items-center gap-6 max-w-sm w-full mx-4">
				
				{/* Close Button */}
				<button 
					onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded-full text-text-dark/40 hover:bg-black/5 hover:text-text-dark transition-colors"
					aria-label="Close popup"
				>
					<X size={24} /> 
				</button>

				<div className="flex flex-col gap-2">
					<h2 className="text-3xl font-heading font-bold text-text-dark">
						Game Over
					</h2>
					<p className="text-lg font-medium text-text-dark/70">
						{status}
					</p>
				</div>

				<div className="flex w-full gap-3 mt-4">
					{/* Reusing your custom Button component */}
					<Button variant="secondary" onClick={onHome} className="flex-1">
						Home
					</Button>
					<Button variant="primary" onClick={onNewGame} className="flex-1">
						New Game
					</Button>
				</div>

			</div>
		</div>
	);
};

export default GameEndPopup;