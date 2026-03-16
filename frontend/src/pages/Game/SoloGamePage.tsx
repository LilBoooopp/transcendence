import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SoloChessGame from '../../components/chessgui/SoloChessGame';

export default function SoloGamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const raw = searchParams.get('color');
  const playerColor: 'white' | 'black' =
    raw === 'black' ? 'black' : 'white';

  return (
    <SoloChessGame playerColor={playerColor} />
  );
}
