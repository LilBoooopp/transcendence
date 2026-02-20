import React from 'react';
import Button from './Button';

interface LoginTileProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function LoginTile({ onLogin, onRegister }: LoginTileProps) {
  return (
    <div className="bg-primary rounded-xl shadow-sm  p-8 text-center w-full max-w-md mx-auto">
      <h2 className="text-text-default text-2xl font-heading mb-4">Track Your Progress</h2>
      <p className="text-text-default font-body text-sm m-0">
        Log in to view your match history, analyze past games, and track your rating improvement over time.
      </p>
      <div className="flex justify-center gap-4 p-4 mt-4">
        <Button variant="secondary" onClick={onLogin}>Log In</Button>
        <Button variant="secondary" onClick={onRegister}>Register</Button>
      </div>
    </div>
  );
}