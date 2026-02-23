import React from 'react'
import Piece from './Piece'

interface TileProps {
  rank: number
  file: number
  piece?: string
  isHighlighted: boolean
  theme: Record<string, string>
  onClick: () => void
}

const Tile = (props: TileProps) => {
  const { rank, file } = props
  const isLight = (rank + file) % 2 !== 0

  return (
    <div 
      onClick={props.onClick}
      style={{
        backgroundColor: props.isHighlighted ? 'yellow' : isLight ? '#f0d9b5' : '#b58863'
      }}
    >
      {props.piece && <Piece type={props.piece} theme={props.theme}/>}
    </div>
  )
}

export default Tile
