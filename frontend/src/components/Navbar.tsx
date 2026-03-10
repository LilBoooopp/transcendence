import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Toggle from './Toggle';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({ isDarkMode, toggleDarkMode }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
    <nav className="relative bg-primary text-text-default shadow-md transition-colors duration-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* LOGO (name) */}
        <div className="text-2xl font-heading font-bold">
          42 Chess
        </div>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden md:flex items-center gap-8 font-body font-medium">
          <div className="flex gap-6">
            <Link to="/wireframe/games" className="hover:text-accent transition-colors">Home</Link>
            <Link to="/wireframe" className="hover:text-accent transition-colors">Dashboard</Link>
            <Link to="/wireframe/social" className="hover:text-accent transition-colors">Social</Link>
          </div>

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

        {/* MOBILE MENU BUTTON */}
        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-primary border-t border-gray-200 shadow-lg flex flex-col p-4 gap-4 z-50 font-body font-medium">
          <Link to="/wireframe/games" className="hover:text-accent transition-colors" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/wireframe" className="hover:text-accent transition-colors" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
          <Link to="/wireframe/social" className="hover:text-accent transition-colors" onClick={() => setIsMenuOpen(false)}>Social</Link>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-300/20">
            <span>Dark Mode</span>
            <Toggle 
              isOn={isDarkMode} 
              onToggle={toggleDarkMode} 
              ariaLabel="Toggle Dark Mode"
              onLabel="🌙"
              offLabel="☀️"
            />
          </div>
        </div>
      )}
    </nav>
  );
}