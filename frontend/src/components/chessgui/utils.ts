import { PieceSymbol, Color } from '../chess/src/types'

type EngineSquare = { type: PieceSymbol; color: Color; square: string } | null

export function convertBoard(engineBoard: EngineSquare[][]): (string | null)[][] {
  return (engineBoard.map(rank =>
    rank.map(square => {
      if (square === null) return (null)
      return (square.color + square.type.toUpperCase())
    })
  ))
} 
