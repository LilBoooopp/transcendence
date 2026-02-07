import React, { useEffect, useState } from 'react';
import { socketService } from '../services/socket.service';

interface GameProps {
  gameId: string;
  userId: string;
}

const Game: React.FC<GameProps> = ({ gameId, userId }) => {
  const [fen, setFen] = useState('start');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    socketService.connect(userId);

    // Join the game room
    socketService.joinGame(gameId);

    // Listen fro oppeonent moves
    socketService.onMove((data) => {
      console.log('Opponent moved:', data.move);
      setFen(data.fen);
    });

    // Listen for chat messages
    socketService.onChatMessage((data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Listen for game over
    socketService.onGameOver((data) => {
      console.log('Game over:', data);
      alert(`Game Over! Winner: ${data.winner}`);
    });

    // Cleanup
    return () => {
      socketService.leaveGame(gameId);
      socketService.off('game:move');
      socketService.off('chat:message');
      socketService.off('game:over');
    };

  }, [gameId, userId]);

  const handleMove = (move: any) => {
    // Send move to server
    socketService.sendMove(gameId, move, fen);
  };

  const handleSendMessage = (message: string) => {
    socketService.sendChatMessage(message, userId, gameId);
  };

  return (
    <div>
      <h1>Game: {gameId}</h1>
      {/* Chessboard goes here */}
      {/* chatbox goes here */}
    </div>
  );
};

export default Game;
