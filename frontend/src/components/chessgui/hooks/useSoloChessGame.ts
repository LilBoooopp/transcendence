import { useState, useCallback, useRef } from 'react';
import { Chess } from '../../chess/src/Chess';
import { Square, Move } from '../../chess/src/types';
import { convertBoard } from '../utils';
import { Coord, PromotionPiece } from '../types';

const fileToLetter = (f: number) => String.fromCharCode(f + 97);
const emptyHighlights = () =>
  Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => false));

export interface SoloChessGameProps {
  playerColor: 'white' | 'black';
}

export function useSoloChessGame({ playerColor }: SoloChessGameProps) {
  const gameRef = useRef(new Chess());
  const [board, setBoard] = useState(() => convertBoard(gameRef.current.board()));
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<boolean[][]>(emptyHighlights());
  const [selectedTile, setSelectedTile] = useState<Coord | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Coord; to: Coord } | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('Playing');
  const [gameOver, setGameOver] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'white' | 'black'>('white');
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);

  const gameOverRef = useRef(gameOver);


  // helpers
  const squareToCoord = useCallback((sq: string): Coord => ({
    file: sq.charCodeAt(0) - 97,
    rank: 8 - parseInt(sq[1]),
  }), []);

  const isPawnPromotion = useCallback((from: string, to: string): boolean => {
    const piece = gameRef.current.get(from as Square);
    if (!piece || piece.type !== 'p') return (false);
    const toRank = parseInt(to[1]);
    return ((piece.color === 'w' && toRank === 8) || (piece.color === 'b' && toRank === 1));
  }, []);

  const highlightMovesFrom = useCallback((square: Square) => {
    const moves = gameRef.current.moves({ square, verbose: true }) as Move[];
    const newHL = emptyHighlights();
    moves.forEach(m => {
      const coord = squareToCoord(m.to);
      newHL[coord.rank][coord.file] = true;
    });
    setHighlighted(newHL);
  }, [squareToCoord]);


  /**
   * Sync React state from the engine after every move.
   * Also detects game-over conditions.
   */
  const syncState = useCallback((fromCoord: Coord, toCoord: Coord) => {
    const g = gameRef.current;
    setBoard(convertBoard(g.board()));
    setMoveHistory(g.history());
    setLastMove({ from: fromCoord, to: toCoord });
    setSelectedTile(null);
    setHighlighted(emptyHighlights());

    const nextTurn = g.turn() === 'w' ? 'white' : 'black';
    setCurrentTurn(nextTurn);

    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black wins' : 'White wins';
      setGameStatus(`Checkmate - ${winner}`);
      setGameOver(true);
      gameOverRef.current = true;
    } else if (g.isDraw()) {
      setGameStatus('Draw');
      setGameOver(true);
      gameOverRef.current = true;
    } else if (g.isStalemate()) {
      setGameStatus('Stalemate');
      setGameOver(true);
      gameOverRef.current = true;
    }
  }, []);

  /**
   * Attempt a move
   * @returns true on success.
   */
  const doMove = useCallback((
    from: string,
    to: string,
    promotion?: PromotionPiece,
  ): boolean => {
    try {
      const move = promotion
        ? gameRef.current.move({ from, to, promotion })
        : gameRef.current.move({ from, to });
      if (!move) return (false);
      syncState(squareToCoord(from), squareToCoord(to));
      return (true);
    } catch {
      return (false);
    }
  }, [squareToCoord, syncState]);

  const onTileClick = useCallback((rank: number, file: number) => {
    if (gameOverRef.current) return;

    const currentTurnCode = gameRef.current.turn();

    if (selectedTile) {
      const from = `${fileToLetter(selectedTile.file)}${8 - selectedTile.rank}` as Square;
      const to = `${fileToLetter(file)}${8 - rank}` as Square;

      if (from === to) {
        setSelectedTile(null);
        setHighlighted(emptyHighlights());
        return;
      }

      const targetPiece = board[rank][file];
      if (targetPiece && targetPiece[0] === currentTurnCode) {
        setSelectedTile({ rank, file });
        highlightMovesFrom(to);
        return;
      }

      setSelectedTile(null);
      setHighlighted(emptyHighlights());

      if (isPawnPromotion(from, to)) {
        setPromotionMove({ from, to });
        return;
      }

      doMove(from, to);
    } else {
      const piece = board[rank][file];
      if (!piece || piece[0] !== currentTurnCode) return;

      setSelectedTile({ rank, file });
      const square = `${fileToLetter(file)}${8 - rank}` as Square;
      highlightMovesFrom(square);
    }
  }, [selectedTile, board, isPawnPromotion, doMove, highlightMovesFrom]);

  const onDrop = useCallback((sourceSquare: string, targetSquare: string): boolean => {
    if (gameOverRef.current) return (false);
    if (isPawnPromotion(sourceSquare, targetSquare)) {
      setPromotionMove({ from: sourceSquare, to: targetSquare });
      return (true);
    }
    return (doMove(sourceSquare, targetSquare));
  }, [isPawnPromotion, doMove]);

  const onDragStart = useCallback((rank: number, file: number) => {
    if (gameOverRef.current) return;
    const currentTurnCode = gameRef.current.turn();
    const piece = board[rank][file];
    if (!piece || piece[0] !== currentTurnCode) return;
    setSelectedTile({ rank, file });
    const square = `${fileToLetter(file)}${8 - rank}` as Square;
    highlightMovesFrom(square);
  }, [board, highlightMovesFrom]);

  const completePromotion = useCallback((piece: PromotionPiece) => {
    if (!promotionMove) return;
    doMove(promotionMove.from, promotionMove.to, piece);
    setPromotionMove(null);
  }, [promotionMove, doMove]);

  const resetGame = useCallback(() => {
    gameRef.current = new Chess();
    gameOverRef.current = false;
    setBoard(convertBoard(gameRef.current.board()));
    setMoveHistory([]);
    setHighlighted(emptyHighlights());
    setSelectedTile(null);
    setLastMove(null);
    setGameStatus('Playing');
    setGameOver(false);
    setCurrentTurn('white');
    setPromotionMove(null);
  }, []);

  return {
    board,
    moveHistory,
    highlighted,
    lastMove,
    premoves: [] as { from: Coord; to: Coord }[],
    gameStatus,
    gameOver,
    currentTurn,
    promotionMove,
    onTileClick,
    onDrop,
    onDragStart,
    completePromotion,
    resetGame,
    playerColor,
  };
}
