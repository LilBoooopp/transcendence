import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import React from 'react'
import Tile from './Tile'

interface BoardProps {
  board: (string | null)[][]
  theme: Record<string, string>
  highlighted: boolean[][]
  onTileClick: (rank: number, file: number) => void
  playerColor: 'white' | 'black'
  onDrop: (from: string, to:string) => void
}

const Board = (props: BoardProps) => {
  const fileToLetter = (file: number) => String.fromCharCode(file + 97)
  const handleDrop = (fromRank: number, fromFile: number, toRank: number, toFile: number) => {
    const from = `${fileToLetter(fromFile)}${8 - fromRank}`
    const to = `${fileToLetter(toFile)}${8 - toRank}`
    props.onDrop(from, to)
  }
  const displayBoard = props.playerColor === 'black' ? [...props.board].reverse().map(row => [...row].reverse()) : props.board
  const displayHighlighted = props.playerColor === 'black' ? [...props.highlighted].reverse().map(row => [...row].reverse()) : props.highlighted
  return (
    <DndProvider backend={HTML5Backend}>
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
              onDrop={handleDrop}
              onClick={() => {
              const actualRank = props.playerColor === 'black' ? 7 - rankIndex : rankIndex
              const actualFile = props.playerColor === 'black' ? 7 - fileIndex : fileIndex
              props.onTileClick(actualRank, actualFile)
              }}
            />
          )
        )}
      </div>
    </DndProvider>
  )
}

export default Board
