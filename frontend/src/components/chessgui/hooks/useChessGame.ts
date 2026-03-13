import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chess } from '../../chess/src/Chess';
import { Square, Move } from '../../chess/src/types';
import { socketService } from '../../../services/socket.service';
import { convertBoard } from '../utils';
import { getPremoveTargets } from '../premoveTargets';
import { useTimer } from './useTimer';
import { Coord, Premove, TimerState, PromotionPiece, ChessGameProps } from '../types';

const fileToLetter = (f: number) => String.fromCharCode(f + 97);
const emptyHighlights = () =>
  Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => false));

export function useChessGame({
  gameId,
  userId,
  playerColor,
  isSpectator = false,
  initialState = null,
  initialTimer = null,
  initialGameOver = null,
}: ChessGameProps) {
  const gameRef = useRef(new Chess());

  const [board, setBoard] = useState(() => convertBoard(gameRef.current.board()));
  const [fen, setFen] = useState('start');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<boolean[][]>(emptyHighlights());
  const [selectedTile, setSelectedTile] = useState<Coord | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Coord; to: Coord } | null>(null);

  const [gameStatus, setGameStatus] = useState<string>(
    initialGameOver ? `Game Over - ${initialGameOver.result}` : 'Playing'
  );
  const [gameOver, setGameOver] = useState(!!initialGameOver);

  const gameOverRef = useRef(gameOver);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  const [premoves, setPremoves] = useState<Premove[]>([]);
  const premovesRef = useRef(premoves);
  useEffect(() => { premovesRef.current = premoves; }, [premoves]);

  const [arrows, setArrows] = useState<{ start: Coord; end: Coord }[]>([]);
  const [arrowStart, setArrowStart] = useState<Coord | null>(null);

  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);

  const [drawOffered, setDrawOffered] = useState(false);
  const [drawOfferSent, setDrawOfferSent] = useState(false);

  const timer = useTimer(gameOver);

  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [reconnectSecondsLeft, setReconnectSecondsLeft] = useState(0);
  const reconnectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // helpers

  const clearHighlights = useCallback(() => setHighlighted(emptyHighlights()), []);

  const squareToCoord = useCallback((square: string): Coord => ({
    file: square.charCodeAt(0) - 97,
    rank: 8 - parseInt(square[1]),
  }), []);

  const isPawnPromotion = useCallback((from: string, to: string): boolean => {
    const piece = gameRef.current.get(from as Square);
    if (!piece || piece.type !== 'p') return (false);
    return (piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1');
  }, []);

  const isOwnPiece = useCallback((piece: string) =>
    (playerColor === 'white' && piece[0] === 'w') ||
    (playerColor === 'black' && piece[0] === 'b'),
    [playerColor]);

  const isPlayerTurn = useCallback(() => {
    const turn = gameRef.current.turn();
    return (playerColor === 'white' && turn === 'w') ||
      (playerColor === 'black' && turn === 'b');
  }, [playerColor]);

  // Sync board from engin

  const syncBoardFromEngine = useCallback(() => {
    setFen(gameRef.current.fen());
    setBoard(convertBoard(gameRef.current.board()));
    setMoveHistory(gameRef.current.history());
  }, []);

  // Game status

  const updateGameStatus = useCallback((game: Chess) => {
    if (gameOver) return;
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      setGameStatus(`Checkmate - ${winner} wins`);
      setGameOver(true);
      socketService.sendGameOver(gameId, winner, 'Checkmate');
    } else if (game.isStalemate()) {
      setGameStatus('Stalemate - Draw');
      setGameOver(true);
      socketService.sendGameOver(gameId, 'Draw', 'Stalemate');
    } else if (game.isDraw()) {
      setGameStatus('Draw');
      setGameOver(true);
      socketService.sendGameOver(gameId, 'Draw', 'Draw');
    } else if (game.isCheck()) {
      setGameStatus('Check!');
    } else {
      setGameStatus('Playing');
    }
  }, [gameId, gameOver]);

  // Send move

  const sendMove = useCallback((move: any) => {
    const newFen = gameRef.current.fen();
    const newPgn = gameRef.current.pgn();
    syncBoardFromEngine();
    setLastMove({ from: squareToCoord(move.from), to: squareToCoord(move.to) });
    socketService.sendMove(gameId, move, newFen, newPgn);
    updateGameStatus(gameRef.current);
  }, [gameId, squareToCoord, syncBoardFromEngine, updateGameStatus]);

  // Restore on (re)join

  useEffect(() => {
    if (!initialState) return;
    try {
      if (initialState.pgn?.length > 0) {
        gameRef.current.loadPgn(initialState.pgn);
      } else if (initialState.fen && initialState.fen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        gameRef.current.load(initialState.fen);
      }
      const history = gameRef.current.history({ verbose: true }) as Move[];
      if (history.length > 0) {
        const last = history[history.length - 1];
        setLastMove({ from: squareToCoord(last.from), to: squareToCoord(last.to) });
      }
      syncBoardFromEngine();
      updateGameStatus(gameRef.current);
    } catch (err) {
      console.error('Failed to restore initial state:', err);
    }
  }, [initialState]);

  useEffect(() => {
    if (!initialTimer) return;
    timer.syncTimer(initialTimer);
    if (initialTimer.timerRunning) setGameStatus('Playing');
  }, [initialTimer]);

  // socket listening

  useEffect(() => {
    const unsubTimer = socketService.on('game:timer', (data: TimerState) => {
      timer.syncTimer(data);
      setGameStatus((prevStatus) => {
        if (data.timerRunning && prevStatus === 'Waiting for opponent...') {
          return 'Playing';
        }
        return prevStatus;
      });
    });

    const unsubMove = socketService.on('game:move', (data: { move: any; fen: string; pgn: string }) => {
      try {
        if (data.move?.from && data.move?.to) {
          const result = gameRef.current.move({
            from: data.move.from,
            to: data.move.to,
            promotion: data.move.promotion || 'q',
          });
          if (!result) {
            gameRef.current.load(data.fen);
          }
        } else {
          gameRef.current.load(data.fen);
        }
        syncBoardFromEngine();
        setLastMove({ from: squareToCoord(data.move.from), to: squareToCoord(data.move.to) });
        updateGameStatus(gameRef.current);

        // Execute first queued premove
        const queued = premovesRef.current;
        if (queued.length > 0) {
          const next = queued[0];
          const from = `${fileToLetter(next.from.file)}${8 - next.from.rank}`;
          const to = `${fileToLetter(next.to.file)}${8 - next.to.rank}` as Square;
          const move = gameRef.current.move({ from, to });
          if (!move) {
            setPremoves([]);
          } else {
            setPremoves(prev => prev.slice(1));
            sendMove(move);
          }
        }
      } catch (err) {
        console.error('Error applying move, reloading from FEN:', err);
        gameRef.current.load(data.fen);
        syncBoardFromEngine();
      }
    });

    const unsubDisconnected = socketService.on(
      'game:opponent-disconnected',
      (data: { reconnectSeconds: number }) => {
        setOpponentDisconnected(true);
        setReconnectSecondsLeft(data.reconnectSeconds);

        if (reconnectIntervalRef.current) clearInterval(reconnectIntervalRef.current);

        reconnectIntervalRef.current = setInterval(() => {
          setReconnectSecondsLeft((prev) => {
            if (prev <= 1) {
              clearInterval(reconnectIntervalRef.current!);
              reconnectIntervalRef.current = null;
              return (0);
            }
            return (prev - 1);
          });
        }, 1000);
      },
    );

    const unsubReconnected = socketService.on('game:opponent-reconnected', () => {
      setOpponentDisconnected(false);
      setReconnectSecondsLeft(0);
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    });

    const unsubGameOver = socketService.on('game:over', (data: { winner: string; result: string }) => {
      setGameStatus(`Game Over - ${data.result}`);
      timer.setTimerRunning(false);
      setGameOver(true);
    });

    const unsubDrawOffered = socketService.on('game:draw-offered', () => {
      setDrawOffered(true);
    });

    const unsubDrawDeclined = socketService.on('game:draw-declined', () => {
      setDrawOfferSent(false);
    });

    return () => {
      unsubTimer?.();
      unsubMove?.();
      unsubDisconnected?.();
      unsubReconnected?.();
      if (reconnectIntervalRef.current) clearInterval(reconnectIntervalRef.current);
      unsubGameOver?.();
      unsubDrawOffered?.();
      unsubDrawDeclined?.();
    };
  }, [gameId, userId]);

  // Premove virtual board

  const premoveBoard = useMemo(() => {
    const virtual = board.map(row => [...row]);
    premoves.forEach(({ from, to }) => {
      virtual[to.rank][to.file] = virtual[from.rank][from.file];
      virtual[from.rank][from.file] = null;
    });
    return (virtual);
  }, [board, premoves]);

  const premoveBoardRef = useRef(premoveBoard);
  useEffect(() => { premoveBoardRef.current = premoveBoard; }, [premoveBoard]);

  // Legal move highlights

  const highlightMovesFrom = useCallback((square: Square) => {
    const moves = gameRef.current.moves({ square, verbose: true }) as Move[];
    const newHL = emptyHighlights();
    moves.forEach(m => {
      const coord = squareToCoord(m.to);
      newHL[coord.rank][coord.file] = true;
    });
    setHighlighted(newHL);
  }, [squareToCoord]);

  // Tile click
  const onTileClick = useCallback((rank: number, file: number) => {
    if (isSpectator || gameOver) return;
    setArrows([]);

    if (isPlayerTurn()) {
      if (selectedTile) {
        const from = `${fileToLetter(selectedTile.file)}${8 - selectedTile.rank}` as Square;
        const to = `${fileToLetter(file)}${8 - rank}` as Square;
        setSelectedTile(null);
        clearHighlights();

        if (isPawnPromotion(from, to)) {
          setPromotionMove({ from, to });
          return;
        }

        const move = gameRef.current.move({ from, to });
        if (!move) {
          const piece = board[rank][file];
          if (piece && isOwnPiece(piece)) {
            setSelectedTile({ rank, file });
            highlightMovesFrom(to);
          }
          return;
        }

        sendMove(move);
        setPremoves([]);
      } else {
        const piece = board[rank][file];
        if (!piece || !isOwnPiece(piece)) return;
        setSelectedTile({ rank, file });
        const square = `${fileToLetter(file)}${8 - rank}` as Square;
        highlightMovesFrom(square);
      }
    } else {
      // Premove
      if (selectedTile) {
        setPremoves(prev => [...prev, {
          from: { rank: selectedTile.rank, file: selectedTile.file },
          to: { rank, file },
        }]);
        setSelectedTile(null);
        clearHighlights();
      } else {
        const piece = premoveBoardRef.current[rank][file];
        if (!piece) { setPremoves([]); clearHighlights(); return; }
        if (!isOwnPiece(piece)) return;
        setSelectedTile({ rank, file });
        const targets = getPremoveTargets(piece, rank, file);
        const newHL = emptyHighlights();
        targets.forEach(({ rank: r, file: f }) => { newHL[r][f] = true; });
        setHighlighted(newHL);
      }
    }
  }, [isSpectator, isPlayerTurn, selectedTile, board, clearHighlights,
    isPawnPromotion, isOwnPiece, highlightMovesFrom, sendMove, gameOver]);

  // Drag handling

  const onPieceDragStart = useCallback((rank: number, file: number) => {
    if (isSpectator || gameOverRef.current) return;
    setSelectedTile({ rank, file });
    const piece = board[rank][file];
    if (!piece || !isPlayerTurn()) return;
    const square = `${fileToLetter(file)}${8 - rank}` as Square;
    highlightMovesFrom(square);
  }, [isSpectator, board, isPlayerTurn, highlightMovesFrom]);

  const onDrop = useCallback((sourceSquare: string, targetSquare: string): boolean => {
    if (isSpectator || gameOverRef.current) return (false);

    if (!isPlayerTurn()) {
      const from = squareToCoord(sourceSquare);
      const to = squareToCoord(targetSquare);
      const piece = premoveBoardRef.current[from.rank][from.file];
      if (!piece || !isOwnPiece(piece)) return (false);
      setPremoves(prev => [...prev, { from, to }]);
      setSelectedTile(null);
      clearHighlights();
      return (true);
    }

    try {
      if (isPawnPromotion(sourceSquare, targetSquare)) {
        setPromotionMove({ from: sourceSquare, to: targetSquare });
        return (true);
      }
      const move = gameRef.current.move({ from: sourceSquare, to: targetSquare });
      if (!move) return (false);
      sendMove(move);
      setPremoves([]);
      setSelectedTile(null);
      clearHighlights();
      return (true);
    } catch {
      return (false);
    }
  }, [isSpectator, isPlayerTurn, isOwnPiece, isPawnPromotion, squareToCoord,
    sendMove, clearHighlights]);

  // Promotion

  const completePromotion = useCallback((piece: PromotionPiece) => {
    if (!promotionMove) return;
    const move = gameRef.current.move({ from: promotionMove.from, to: promotionMove.to, promotion: piece });
    if (!move) return;
    sendMove(move);
    setPromotionMove(null);
  }, [promotionMove, sendMove]);

  const handleResign = useCallback(() => {
    if (isSpectator || gameOver) return;
    socketService.sendResign(gameId);
  }, [gameId, isSpectator, gameOver]);

  const handleDrawOffer = useCallback(() => {
    if (isSpectator || gameOver || drawOfferSent) return;
    setDrawOfferSent(true);
    socketService.sendDrawOffer(gameId);
  }, [gameId, isSpectator, gameOver, drawOfferSent])

  const handleDrawResponse = useCallback((accepted: boolean) => {
    setDrawOffered(false);
    socketService.sendDrawResponse(gameId, accepted);
  }, [gameId]);

  // api

  return {
    board: premoveBoard,
    moveHistory,
    highlighted,
    lastMove,
    premoves,
    arrows,
    setArrows,
    arrowStart,
    setArrowStart,
    gameStatus,
    gameOver,
    promotionMove,
    timer,
    onTileClick,
    onDrop,
    onDragStart: onPieceDragStart,
    completePromotion,
    drawOffered,
    drawOfferSent,
    handleResign,
    handleDrawOffer,
    handleDrawResponse,
    opponentDisconnected,
    reconnectSecondsLeft,
  };
}
