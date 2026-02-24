import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import React, { useRef, useEffect, useState } from 'react'
import Tile from './Tile'

interface BoardProps {
  board: (string | null)[][]
  theme: Record<string, string>
  highlighted: boolean[][]
  onTileClick: (rank: number, file: number) => void
  playerColor: 'white' | 'black'
  onDrop: (from: string, to:string) => void
  onDragStart: (rank: number, file: number) => void
  lastMove: { from: { rank: number, file: number }, to: { rank: number, file: number } } | null
}

const Board = (props: BoardProps) => {
  // canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [arrowStart, setArrowStart] = useState<{ rank:number, file: number } | null>(null)
  const [arrows, setArrows] = useState<{ start: { rank: number, file: number }, end: { rank: number, file: number } }[]>([])

  const displayLastMove = props.lastMove && props.playerColor === 'black' ? {
    from: { rank: 7 - props.lastMove.from.rank, file: 7 - props.lastMove.from.file },
    to: { rank: 7 - props.lastMove.to.Rank, file: 7 - props.lastMove.to.file }
  } : props.lastMove

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

  useEffect(() => {
    const canvas = canvasRef.current
    const board = boardRef.current
    if (!canvas || !board) return

    const size = board.getBoundingClientRect()
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const tileSize = size.width / 8

    arrows.forEach(({ start, end }) => {
      const displayStart = props.playerColor === 'black'
        ? { rank: 7 - start.rank, file: 7 - start.file }
        : start
      const displayEnd = props.playerColor === 'black'
        ? { rank: 7 - end.rank, file: 7 - end.file }
        : end

      const fromX = (displayStart.file + 0.5) * tileSize
      const fromY = (displayStart.rank + 0.5) * tileSize
      const toX = (displayEnd.file + 0.5) * tileSize
      const toY = (displayEnd.rank + 0.5) * tileSize

      // Draw line
      const angle = Math.atan2(toY - fromY, toX - fromX)
      const headSize = tileSize * 0.3
      const lineEndX = toX - headSize * Math.cos(angle)
      const lineEndY = toY - headSize * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(lineEndX, lineEndY)
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.8)'
      ctx.lineWidth = tileSize * 0.15
      ctx.lineCap = 'round'
      ctx.stroke()


      // Draw arrowhead
      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(toX - headSize * Math.cos(angle - Math.PI / 6), toY - headSize * Math.sin(angle - Math.PI / 6))
      ctx.lineTo(toX - headSize * Math.cos(angle + Math.PI / 6), toY - headSize * Math.sin(angle + Math.PI / 6))
      ctx.closePath()
      ctx.fillStyle = 'rgba(255, 170, 0, 0.8)'
      ctx.fill()
    })
  }, [arrows])

  const displayBoard = props.playerColor === 'black'
    ? [...props.board].reverse().map(row => [...row].reverse())
    : props.board
  const displayHighlighted = props.playerColor === 'black'
    ? [...props.highlighted].reverse().map(row => [...row].reverse())
    : props.highlighted
  return (
    <DndProvider backend={HTML5Backend}>
      {/* Board div */}
      <div style={{ position: 'relative', width: '100%', display: 'inline-block' }}>
        <div
          ref={boardRef}
          onMouseDown={(e) => { if (e.button === 0) setArrows([]) }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)' }}
        >
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
                  onRightMouseDown={() => setArrowStart({ rank: actualRank, file: actualFile })}
                  onRightMouseUp={() => {
                    if (arrowStart) {
                      setArrows(prev => [...prev, { start: arrowStart, end: { rank: actualRank, file: actualFile } }])
                      setArrowStart(null)
                    }
                  }}
                  isLastMove={
                    displayLastMove !== null && (
                      (rankIndex === displayLastMove.from.rank && fileIndex === displayLastMove.from.file) ||
                      (rankIndex === displayLastMove.to.rank && fileIndex === displayLastMove.to.file)
                    )
                  }
                />
              )
            })
          )}
        </div>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            pointerEvents: 'none',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </DndProvider>
  )
}

export default Board
