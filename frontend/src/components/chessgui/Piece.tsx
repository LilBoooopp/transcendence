import React from 'react'
import { useDrag } from 'react-dnd'

interface PieceProps {
  type: string // e.g. "wK", "bQ"
  theme: Record<string, string>
  rank: number
  file: number
  onDragStart: (rank: number, file: number) => void
}

const Piece = (props: PieceProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PIECE',
    item: () => {
      props.onDragStart(props.rank, props.file)
      return { fromRank: props.rank, fromFile: props.file, piece: props.type }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }))

  return (
    <img
      ref={drag}
      src={props.theme[props.type]}
      style={{
        width: '100%',
        height: '100%',
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab'
      }} 
    />
  )
}

export default Piece
