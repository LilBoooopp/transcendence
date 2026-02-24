import React from 'react'
import Piece from './Piece'
import { useDrop } from 'react-dnd'

interface TileProps {
  rank: number
  file: number
  piece?: string
  isHighlighted: boolean
  theme: Record<string, string>
  onClick: () => void
  onDrop: (fromRank: number, fromFile: number, toRank: number, toFile: number) => void
}

const Tile = (props: TileProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'PIECE',
    drop: (item: { fromRank: number, fromFile: number, piece: string }) => {
      props.onDrop(item.fromRank, item.fromFile, props.rank, props.file)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }))
  const { rank, file } = props
  const isLight = (rank + file) % 2 !== 0

  return (
    <div
      ref={drop}
      onClick={props.onClick}
      style={{
        position: 'relative',
        aspectRatio: '1',
        backgroundColor: isLight ? '#f0d9b5' : '#b58863',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {props.piece && <Piece type={props.piece} theme={props.theme} rank={rank} file={file} />}
      {props.isHighlighted && (
        <div
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '30%', height: '30%',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.2)',
            pointerEvents: 'none',
          }} />
      )}
    </div>
  )
}

export default Tile
