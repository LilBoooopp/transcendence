import React from 'react';
import { Link } from 'react-router-dom';
import Toggle from './Toggle';

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({ isDarkMode, toggleDarkMode }: NavbarProps) {
  return (
    // justify-between pushes the Logo to the left and the Nav/Toggle group to the right
    <nav className="flex items-center justify-between px-6 py-4 bg-primary text-text-default shadow-md transition-colors duration-200">
      
      {/* LOGO Left oriented*/}
      <div className="text-2xl font-heading font-bold">
        42 Chess
      </div>

      {/* Navigation & Button right oriented */}
      <div className="flex items-center gap-8 font-body font-medium">
        
        {/* NAVIGATIO */}
        <div className="hidden md:flex gap-6">
          <Link to="/wireframe" className="hover:text-accent transition-colors">Dashboard</Link>
          <Link to="/wireframe/games" className="hover:text-accent transition-colors">Games</Link>
          <Link to="/wireframe/social" className="hover:text-accent transition-colors">Social</Link>
        </div>

		{/* The Upgraded Toggle Component in Action! */}
		<div className="flex items-center">
			<Toggle 
			isOn={isDarkMode} 
			onToggle={toggleDarkMode} 
			ariaLabel="Toggle Dark Mode"
			onLabel="🌙"
			offLabel="☀️"
			/>
		</div>
        
      </div>

    </nav>
  );
}