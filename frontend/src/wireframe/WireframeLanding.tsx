import React from 'react';
import { Link } from 'react-router-dom';
import Button from './components/Button';

export default function WireframeLanding() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 max-w-3xl mx-auto space-y-8">
      
      {/* Showcasing your Young Serif headings */}
      <div className="space-y-4">
        <h1>Welcome to ft_transcendence</h1>
        <h2>The Ultimate Gaming Platform</h2>
      </div>

      {/* Showcasing your Geist paragraph */}
      <p className="text-lg opacity-90">
        This page demonstrates our custom design system. Notice how the headings use the Young Serif font, 
        while this paragraph uses Geist. The colors perfectly match our corporate identity, and everything 
        responds flawlessly to your layout's dark mode toggle.
      </p>

      {/* Showcasing your reusable Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Button variant="primary">
          Play Now
        </Button>

        <Link to="/wireframe">
          <Button variant="secondary">
            View Dashboard
          </Button>
        </Link>

        <Button variant="accent">
          Learn More
        </Button>
      </div>
      
    </div>
  );
}