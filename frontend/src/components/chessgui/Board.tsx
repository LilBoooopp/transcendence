import React from 'react'
import Tile from './Tile'

interface BoardProps {
  board: (string | null)[][]
  theme: Record<string, string>
  highlighted: boolean[][]
  onTileClick: (rank: number, file: number) => void
  playerColor: 'white' | 'black'
}

const Board = (props: BoardProps) => {
  const displayBoard = props.playerColor === 'black' ? [...props.board].reverse().map(row => [...row].reverse()) : props.board
  const displayHighlighted = props.playerColor === 'black' ? [...props.highlighted].reverse().map(row => [...row].reverse()) : props.highlighted
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)' }}>
      {displayBoard.map((rank, rankIndex) =>
        rank.map((piece, fileIndex) =>
          <Tile
            key={`${rankIndex}-${fileIndex}`}
            rank={rankIndex}
            file={fileIndex}
            piece={piece ?? undefined}
            theme={props.theme}
            isHighlighted={displayHighlighted[rankIndex][fileIndex]}
            onClick={() => {
            const actualRank = props.playerColor === 'black' ? 7 - rankIndex : rankIndex
            const actualFile = props.playerColor === 'black' ? 7 - fileIndex : fileIndex
            props.onTileClick(actualRank, actualFile)
            }}
          />
        )
      )}
    </div>
  )
}

export default Board
