import React from 'react'

interface PieceProps {
  type: string // e.g. "wK", "bQ"
  theme: Record<string, string>
}

const Piece = (props: PieceProps) => {
  return <img
    src={props.theme[props.type]}
    style={{ width: '100%', height: '100%' }} 
  />
}

export default Piece
