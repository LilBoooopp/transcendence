import React, { useState, useEffect, useCallback, useRef } from 'react';
import Board from './chessgui/Board'
import { convertBoard } from './chessgui/utils'
import { classicTheme } from './chessgui/themes'
import { Chess } from './chess/src/Chess';
import { Square, Move } from './chess/src/types'
import { socketService } from '../services/socket.service';

interface ChessGameProps {
  gameId: string;
  userId: string;
  playerColor: 'white' | 'black';
  isSpectator?: boolean;
  initialState?: { fen: string; pgn: string } | null;
  initialTimer?: { whiteTimeMs: number; blackTimeMs: number; currentTurn: string; timerRunning: boolean } | null;
}

const formatTime = (ms: number): string => {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return (`${minutes}:${seconds.toString().padStart(2, '0')}`);
};

const ChessGame: React.FC<ChessGameProps> = ({ gameId, userId, playerColor, isSpectator = false, initialState = null, initialTimer = null }) => {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState('start');
  const [board, setBoard] = useState(convertBoard(gameRef.current.board()))
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<boolean[][]>(Array.from({ length: 8}).map(() => Array.from({ length: 8 }).map(() => false)))
  const [selectedTile, setSelectedTile] = useState<{ rank: number, file: number } | null>(null)
  const [gameStatus, setGameStatus] = useState<string>('Playing');
  const [gameOver, setGameOver] = useState(false);

  // Timer state
  const [whiteTimeMs, setWhiteTimeMs] = useState(10 * 60 * 1000);
  const [blackTimeMs, setBlackTimeMs] = useState(10 * 60 * 1000);
  const [currentTurn, setCurrentTurn] = useState<string>('w');
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore game state from props
  useEffect(() => {
    if (!initialState) return;
    console.log('Restoring game from initial state:', initialState);
    try {
      if (initialState.pgn && initialState.pgn.length > 0) {
        gameRef.current.loadPgn(initialState.pgn);
      } else if (initialState.fen && initialState.fen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        gameRef.current.load(initialState.fen);
      }
      setFen(gameRef.current.fen());
      setMoveHistory(gameRef.current.history());
      setBoard(convertBoard(gameRef.current.board()));
      updateGameStatus(gameRef.current);
    } catch (error) {
      console.error('Error restoring initial state:', error);
    }
  }, [initialState]);

  useEffect(() => {
    if (!initialTimer) return;
  console.log('Restoring timer from initial props:', initialTimer);
    setWhiteTimeMs(initialTimer.whiteTimeMs);
    setBlackTimeMs(initialTimer.blackTimeMs);
    setCurrentTurn(initialTimer.currentTurn);
    setTimerRunning(initialTimer.timerRunning);
    if (initialTimer.timerRunning) {
      setGameStatus('Playing');
    }
  }, [initialTimer]);

  // local countdown timer
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!timerRunning || gameOver) return;

    timerRef.current = setInterval(() => {
      if (currentTurn === 'w') {
        setWhiteTimeMs((prev) => Math.max(0, prev - 100));
      } else {
        setBlackTimeMs((prev) => Math.max(0, prev - 100));
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerRunning, currentTurn, gameOver]);

  // Socket event listeners
  useEffect(() => {
    console.log('Setting up game listeners for:', gameId);

    const unsubTimer = socketService.on('game:timer', (data: { whiteTimeMs: number; blackTimeMs: number; currentTurn: string; timerRunning: boolean }) => {
      console.log('Timer update:', data);
      setWhiteTimeMs(data.whiteTimeMs);
      setBlackTimeMs(data.blackTimeMs);
      setCurrentTurn(data.currentTurn);
      setTimerRunning(data.timerRunning);
      if (data.timerRunning && gameStatus === 'Waiting for opponent...') {
        setGameStatus('Playing');
      }
    });
    
    const unsubMove = socketService.on('game:move', (data: { move: any; fen: string; pgn: string }) => {
      console.log('Received opponent move:', data);

      try {
        // Validate the move can be applied to current position
        const currentFen = gameRef.current.fen();
        if (data.move && data.move.from && data.move.to && data.move.before === currentFen) {
          gameRef.current.move({
            from: data.move.from,
            to: data.move.to,
            promotion: data.move.promotion || 'q',
          });
        } else {
          // out of sync -> load FEN
          console.log('Board out of sync, loading from fen');
          gameRef.current.load(data.fen);
        }

        setFen(gameRef.current.fen());
        setMoveHistory(gameRef.current.history());
        setBoard(convertBoard(gameRef.current.board()));
        updateGameStatus(gameRef.current);
      } catch (error) {
        console.error('Error applying move, falling back to fen:', error);
        gameRef.current.load(data.fen);
        setFen(data.fen);
      }
    });

    const unsubGameOver = socketService.on('game:over', (data: { winner: string; result: string }) => {
      console.log('Game over:', data);
      setGameStatus(`Game Over - ${data.result}`);
      setTimerRunning(false);
      setGameOver(true);
    });

    return () => {
      if (unsubTimer) unsubTimer();
      if (unsubMove) unsubMove();
      if (unsubGameOver) unsubGameOver();
    };
  }, [gameId, userId]);

  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      const winner = currentGame.turn() === 'w' ? 'Black' : 'White';
      setGameStatus(`Checkmate! ${winner} wins`);
      setGameOver(true);
      socketService.sendGameOver(gameId, winner, 'Checkmate');
    } else if (currentGame.isDraw()) {
      setGameStatus('Draw');
      setGameOver(true);
      socketService.sendGameOver(gameId, 'Draw', 'Draw');
    } else if (currentGame.isStalemate()) {
      setGameStatus('Stalemate');
      setGameOver(true);
      socketService.sendGameOver(gameId, 'Draw', 'Stalemate');
    } else if (currentGame.isCheck()) {
      setGameStatus('Check!');
    } else {
      setGameStatus('Playing');
    }
  };

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (isSpectator) {
        console.log('Spectators cannot move pieces');
        return (false);
      }

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
        setHighlighted(Array.from({ length: 8 }).map(() =>
          Array.from({ length: 8 }).map(() => false)
        ))


        const newFen = game.fen();
        const newPgn = game.pgn();
        setFen(newFen);
        setMoveHistory(game.history());
        setBoard(convertBoard(game.board()))

        console.log('Sending move to opponent:', move);
        socketService.sendMove(gameId, move, newFen, newPgn);

        updateGameStatus(game);
        return (true);
      } catch (error) {
        console.error('Invalid move:', error);
        return (false);
      }
    }, [gameId, playerColor, isSpectator]
  );

  // This is only because I want to be able to see the dots for possible moves when dragging...
  function onPieceDragStart(rank: number, file: number) {
    if (isSpectator) return
    const currentTurn = gameRef.current.turn()
    const isPlayerTurn =
      (playerColor === 'white' && currentTurn === 'w') ||
      (playerColor === 'black' && currentTurn === 'b')
    if (!isPlayerTurn) return

    const fileToLetter = (f: number) => String.fromCharCode(f + 97)
    const squareToCoord = (square: string) => ({
      file: square.charCodeAt(0) - 97,
      rank: 8 - parseInt(square[1])
    })
    const from = `${fileToLetter(file)}${8 - rank}` as Square
    const moves = gameRef.current.moves({ square: from, verbose: true }) as Move[]
    const newHighlighted = Array.from({ length: 8 }).map(() =>
      Array.from({length: 8 }).map(() => false)
    )
    moves.forEach(move => {
      const { rank, file } = squareToCoord(move.to)
      newHighlighted[rank][file] = true
    })
    setHighlighted(newHighlighted)
  }

  function onTileClick(rank: number, file: number) {
    const fileToLetter = (file: number) => String.fromCharCode(file + 97)
    const squareToCoord = (square: string) => ({
      file: square.charCodeAt(0) - 97,
      rank: 8 - parseInt(square[1])
    })

    // Spectator and turn guards
    if (isSpectator) return
    const currentTurn = gameRef.current.turn()
    const isPlayerTurn =
      (playerColor === 'white' && currentTurn === 'w') ||
        (playerColor === 'black' && currentTurn === 'b')
    if (!isPlayerTurn) return

    if (!highlighted[rank][file]) {
      if (board[rank][file]) {
        setSelectedTile({ rank, file })

        const from = `${fileToLetter(file)}${8 - rank}` as Square
        const moves = gameRef.current.moves({ square: from, verbose: true }) as Move[]

        const newHighlighted = Array.from({ length: 8 }).map(() =>
          Array.from({ length: 8 }).map(() => false)
        )

        moves.forEach(move => {
          const { rank, file } = squareToCoord(move.to)
          newHighlighted[rank][file] = true
        })

        setHighlighted(newHighlighted)
      }
    } else {
      setSelectedTile(null)
      setHighlighted(Array.from({ length: 8 }).map(() =>
        Array.from({ length: 8 }).map(() => false)
      ))
      const from = `${fileToLetter(selectedTile!.file)}${8 - selectedTile!.rank}` as Square
      const to = `${fileToLetter(file)}${8 - rank}` as Square
      const move = gameRef.current.move({ from, to })
      if (!move) return
      const newFen = gameRef.current.fen()
      const newPgn = gameRef.current.pgn()
      setFen(newFen)
      setMoveHistory(gameRef.current.history())
      setBoard(convertBoard(gameRef.current.board()))
      socketService.sendMove(gameId, move, newFen, newPgn)
      updateGameStatus(gameRef.current)
      setSelectedTile(null)
      setHighlighted(Array.from({ length: 8}).map(() => Array.from({ length: 8 }).map(() => false)))
    }
  }


  const formatMoveHistory = () => {
    const formatted: JSX.Element[] = [];

    for (let i = 0; i < moveHistory.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moveHistory[i];
      const blackMove = moveHistory[i + 1];

      formatted.push(
        <span key={i} className="bg-white pg-2 py-1 rounded text-sm">
          {moveNumber}. {whiteMove} {blackMove || ''}
        </span>
      );
    }

    return (formatted);
  };

  // Determine which timer goes on top vs bottom
  const topColor = playerColor === 'white' ? 'b' : 'w';
  const bottomColor = playerColor === 'white' ? 'w' : 'b';
  const topTimeMs = topColor === 'w' ? whiteTimeMs : blackTimeMs;
  const bottomTimeMs = bottomColor === 'w' ? whiteTimeMs : blackTimeMs;
  const topLabel = topColor === 'w' ? 'White' : 'Black';
  const bottomLabel = bottomColor === 'w' ? 'White' : 'Black';

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-lg">
        {isSpectator ? 'Spectating' : `You are playing: `}
        {!isSpectator && <span className="font-bold capitalize">{playerColor}</span>}
        {' '} — <span className={gameOver ? 'text-red-600 font-bold' : ''}>{gameStatus}</span>
      </div>

      <div className="w-full max-w-[600px]">
        {/* Opponent timer (top) */}
        <div className={`flex justify-between items-center mb-2 px-4 py-2 rounded ${
          currentTurn === topColor && timerRunning ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-200'
        }`}>
          <span className="font-semibold">{topLabel}</span>
          <span className={`text-2xl font-mono font-bold ${
            (topColor === 'w' ? whiteTimeMs : blackTimeMs) < 60000 ? 'text-red-600' : ''
          }`}>
            {formatTime(topTimeMs)}
          </span>
        </div>

        <Board
          board={board}
          theme={classicTheme}
          highlighted={highlighted}
          onTileClick={onTileClick}
          onDrop={onDrop}
          onDragStart={onPieceDragStart}
          playerColor={playerColor}
          // onPieceDrop={onDrop}
          // boardOrientation={playerColor}
          // arePiecesDraggable={!isSpectator && !gameOver}
          // customBoardStyle={{
          //   borderRadius: '4px',
          //   boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          // }}
        />

        {/* Your timer (bottom) */}
        <div className={`flex justify-between items-center mt-2 px-4 py-2 rounded ${
          currentTurn === bottomColor && timerRunning ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-200'
        }`}>
          <span className="font-semibold">{bottomLabel}</span>
          <span className={`text-2xl font-mono font-bold ${
            (bottomColor === 'w' ? whiteTimeMs : blackTimeMs) < 60000 ? 'text-red-600' : ''
          }`}>
            {formatTime(bottomTimeMs)}
          </span>
        </div>
      </div>

      {/* Move history */}
      <div className="w-full max-w-[600px] bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Move History</h3>
        <div className="flex flex-wrap gap-2">
          {formatMoveHistory()}
        </div>
      </div>
    </div>
  );
};

export default ChessGame;
