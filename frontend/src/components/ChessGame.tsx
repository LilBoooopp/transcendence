import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { socketService } from '../services/socket.service';

interface ChessGameProps {
  gameId: string;
  userId: string;
  playerColor: 'white' | 'black';
}

const ChessGame: React.FC<ChessGameProps> = ({ gameId, userId, playerColor }) => {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState('start');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('Playing');

  useEffect(() => {
    console.log('Connecting to ws...');
    socketService.connect(userId);
    socketService.joinGame(gameId);

    socketService.loadGame(gameId);
    socketService.onGameLoaded((data) => {
      console.log('Game loaded:', data);

      if (data.fen && data.fen !== 'start') {
        gameRef.current.load(data.fen);
        setFen(data.fen);
        setMoveHistory(gameRef.current.history());
      }
    });

    socketService.onMove((data) => {
      console.log('Received opponent move:', data);

      try {
        if (data.move && data.move.from && data.move.to) {
          gameRef.current.move({
            from: data.move.from,
            to: data.move.to,
            promotion: data.move.promotion || 'q',
          });
        } else {
          gameRef.current.load(data.fen);
        }

        setFen(gameRef.current.fen());
        setMoveHistory(gameRef.current.history());
        updateGameStatus(gameRef.current);
      } catch (error) {
        console.error('Error applying move:', error);
        gameRef.current.load(data.fen);
        setFen(data.fen);
        setMoveHistory(gameRef.current.history());
      }
    });

    socketService.onGameOver((data) => {
      console.log('Game over:', data);
      setGameStatus(`Game Over - ${data.result}`);
      alert(`Game Over! ${data.result}`);
    });

    return () => {
      socketService.leaveGame(gameId);
      socketService.off('game:move');
      socketService.off('game:over');
    };
  }, [gameId, userId]);

  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      const winner = currentGame.turn() === 'w' ? 'Black' : 'White';
      setGameStatus(`Checkmate! ${winner} wins`);
      socketService.sendGameOver(gameId, winner, 'Checkmate');
    } else if (currentGame.isDraw()) {
      setGameStatus('Draw');
      socketService.sendGameOver(gameId, 'Draw', 'Draw');
    } else if (currentGame.isStalemate()) {
      setGameStatus('Stalemate');
      socketService.sendGameOver(gameId, 'Draw', 'Stalemate');
    } else if (currentGame.isCheck()) {
      setGameStatus('Check!');
    } else {
      setGameStatus('Playing');
    }
  };

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      const game = gameRef.current;
      const currentTurn = game.turn();
      const isPlayerTurn =
        (playerColor === 'white' && currentTurn === 'w') ||
        (playerColor === 'black' && currentTurn === 'b');

      if (!isPlayerTurn) {
        console.log('Not your turn!');
        return (false);
      }

      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
        });

        if (!move) {
          console.log('invalid move');
          return (false);
        }

        const newFen = game.fen();
        setFen(newFen);
        setMoveHistory(game.history());

        console.log('Sending move to opponent:', move);
        socketService.sendMove(gameId, move, newFen);

        updateGameStatus(game);
        return (true);
      } catch (error) {
        console.error('Invalid move:', error);
        return (false);
      }
    }, [gameId, playerColor]
  );

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-2xl font-bold">
        Game: {gameId}
      </div>

      <div className="text-lg">
        You are playing: <span className="font-bold capitalize">{playerColor}</span>
      </div>

      <div className="w-full max-w-[600px]">
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardOrientation={playerColor}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>

      {/*history*/}
      <div className="w-full max-w-[600px] bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Move History</h3>
        <div className="flex flex-wrap gap-2">
          {moveHistory.map((move, index) => (
            <span key={index} className="bg-white px-2 py-1 rounded text-sm">
              {Math.floor(index/2) + 1}. {move}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessGame;
