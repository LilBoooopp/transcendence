import React from 'react'
import { useDragLayer } from 'react-dnd'

interface CustomDragLayerProps {
  theme: Record<string, string>
  tileSize: number
}

const CustomDragLayer = ({ theme, tileSize }: CustomDragLayerProps) => {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem(),
    currentOffset: monitor.getClientOffset(),
  }))

  if (!isDragging || !currentOffset || !item?.piece) return (null);

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 1000,
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <img
        src={theme[item.piece]}
        style={{
          position: 'absolute',
          left: currentOffset.x - tileSize / 2,
          top: currentOffset.y - tileSize / 2,
          width: tileSize,
          height: tileSize,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

export default CustomDragLayer
