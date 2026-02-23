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
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)' }}>
      {props.board.map((rank, rankIndex) =>
        rank.map((piece, fileIndex) =>
          <Tile
            key={`${rankIndex}-${fileIndex}`}
            rank={rankIndex}
            file={fileIndex}
            piece={piece ?? undefined}
            theme={props.theme}
            isHighlighted={props.highlighted[rankIndex][fileIndex]}
            onClick={() => props.onTileClick(rankIndex, fileIndex)}
          />
        )
      )}
    </div>
  )
}

export default Board
