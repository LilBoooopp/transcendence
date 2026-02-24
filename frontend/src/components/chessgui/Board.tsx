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
  const toActual = (rank: number, file: number) => ({
    rank: props.playerColor === 'black' ? 7 - rank : rank,
    file: props.playerColor === 'black' ? 7 - file : file,
  })
  const handleDrop = (fromRank: number, fromFile: number, toRank: number, toFile: number) => {
    const from = toActual(fromRank, fromFile)
    const to = toActual(toRank, toFile)
    props.onDrop(
      `${fileToLetter(from.file)}${8 - from.rank}`,
      `${fileToLetter(to.file)}${8 - to.rank}`
    )
  }
  const displayBoard = props.playerColor === 'black'
    ? [...props.board].reverse().map(row => [...row].reverse())
    : props.board
  const displayHighlighted = props.playerColor === 'black'
    ? [...props.highlighted].reverse().map(row => [...row].reverse())
    : props.highlighted
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)' }}>
        {displayBoard.map((rank, rankIndex) =>
          rank.map((piece, fileIndex) => {
            const { rank: actualRank, file: actualFile } = toActual(rankIndex, fileIndex)
            return (
              <Tile
                key={`${rankIndex}-${fileIndex}`}
                rank={rankIndex}
                file={fileIndex}
                piece={piece ?? undefined}
                theme={props.theme}
                isHighlighted={displayHighlighted[rankIndex][fileIndex]}
                onDrop={handleDrop}
                onDragStart={() => props.onDragStart(actualRank, actualFile)}
                onClick={() => props.onTileClick(actualRank, actualFile)}
              />
            )
          })
        )}
      </div>
    </DndProvider>
  )
}

export default Board
