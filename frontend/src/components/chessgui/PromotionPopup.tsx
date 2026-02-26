import React from 'react'

interface PromotionPopupsProps {
  color: 'white' | 'black'
  theme: Record<string, string>
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void
}

const PromotionPopup = (props: PromotionPopupsProps) => {
  const colorPrefix = props.color === 'white' ? 'w' : 'b'
  const pieces: ('q' | 'r' | 'b' | 'n')[] = ['q', 'r', 'b', 'n']

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}>
        <p style={{ fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
          Choose promotion piece
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {pieces.map(piece => (
            <div
              key={piece}
              onClick={() => props.onSelect(piece)}
              style={{
                width: '70px',
                height: '70px',
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '6px',
                backgroundColor: '#f0d9b5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#cdd16f')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f0d9b5')}
            >
              <img
                src={props.theme[`${colorPrefix}${piece.toUpperCase()}`]}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PromotionPopup
