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
  onDragStart: (rank: number, file: number) => void
}

const Board = (props: BoardProps) => {
  const fileToLetter = (file: number) => String.fromCharCode(file + 97)
  const handleDrop = (fromRank: number, fromFile: number, toRank: number, toFile: number) => {
    const actualFromRank = props.playerColor === 'black' ? 7 - fromRank : fromRank
    const actualFromFile = props.playerColor === 'black' ? 7 - fromFile : fromFile
    const actualToRank = props.playerColor === 'black' ? 7 - toRank : toRank
    const actualToFile = props.playerColor === 'black' ? 7 - toFile : toFile
    const from = `${fileToLetter(actualFromFile)}${8 - actualFromRank}`
    const to = `${fileToLetter(actualToFile)}${8 - actualToRank}`
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
              onDragStart={() => {
                const actualRank = props.playerColor === 'black' ? 7 - rankIndex: rankIndex
                const actualFile = props.playerColor === 'black' ? 7 - fileIndex: fileIndex
                props.onDragStart(actualRank, actualFile)
              }}
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
