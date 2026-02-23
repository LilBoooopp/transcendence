import React from 'react'

interface PieceProps {
  type: string // e.g. "wK", "bQ"
  theme: Record<string, string>
}

const Piece = (props: PieceProps) => {
  return <img src={props.theme[props.type]} />
}

export default Piece
