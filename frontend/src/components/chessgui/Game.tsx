import React, { useState, useRef } from 'react'
import { Chess, Square, Move } from '../chess/src/Chess'
import Board from './Board'
import convertBoard from './utils'

interface GameProps {
  theme: Record<string, string>
}

const Game = (props: GameProps) => {
  const chess = useRef(new Chess())
  const [board, setBoard] = useState<(string | null)[][]>(convertBoard(chess.current.board()))
  const [highlighted, setHighlighted] = useState<boolean[][]>(Array.from({ length: 8}).map(() => Array.from({ length: 8 }).map(() => false)))
  const [selectedTile, setSelectedTile] = useState<{ rank: number, file: number } | null>(null)

  function onTileClick(rank, file) {
    const fileToLetter = (file: number) => String.fromCharCode(file + 97)
    const squareToCoord = (square: string) => ({
      file: square.charCodeAt(0) - 97,
      rank: 8 - parseInt(square[1])
    })
    if (!highlighted[rank][file]) {
      if (board[rank][file]) {
        setSelectedTile({ rank, file})

        const from = `${fileToLetter(file)}${8 - rank}` as Square
        const moves = chess.current.moves({ square: from, verbose: true }) as Move[]

        const newHighlited = Array.from({ length: 8 }).map(() =>
          Array.from({ length: 8 }).map(() => false)
        )

        moves.forEach(move => {
          const { rank, file } = squareToCoord(move.to)
          newHighlited[rank][file] = true
        })

        setHighlighted(newHighlited)
      }
    } else {
      const from = `${fileToLetter(selectedTile!.file)}${8 - selectedTile!.rank}` as Square
      const to = `${fileToLetter(file)}${8 - rank}` as Square
      chess.current.move({ from, to })
      setBoard(convertBoard(chess.current.board()))
      setSelectedTile(null)
      setHighlighted(Array.from({ length: 8}).map(() => Array.from({ length: 8 }).map(() => false)))
    }
  }

  return (
    <div>
      <Board
        board={board}
        theme={props.theme}
        highlighted={highlighted}
        onTileClick={onTileClick}
      />
    </div>
  )
}

export default Game
