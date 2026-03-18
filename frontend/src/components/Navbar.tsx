import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Toggle from './Toggle';
import { Menu, X, LogIn, LogOut } from 'lucide-react';
import LoginPopUp from './LoginPopUp';
import { socketService } from '../services/socket.service';

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({ isDarkMode, toggleDarkMode }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'register'>('login');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    if (token) {
      socketService.connect();
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    socketService.disconnect();
		window.dispatchEvent(new Event('auth-change'));
    navigate('/');
    setIsMenuOpen(false);
  };

  const openModal = (view: 'login' | 'register') => {
    setModalView(view);
    setIsAuthModalOpen(true);
    setIsMenuOpen(false); // Close mobile menu if open
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
		window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <nav className="relative bg-primary text-text-default shadow-md transition-colors duration-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* LOGO (name) */}
        <Link to="/" className="text-2xl font-heading font-bold">42 Chess</Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden md:flex items-center gap-8 font-body font-medium">
          <div className="flex gap-6">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <Link to="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
            <Link to="/user" className="hover:text-accent transition-colors">Profile</Link>
          </div>

          <div className="flex items-center gap-6">
            <Toggle
              isOn={isDarkMode}
              onToggle={toggleDarkMode}
              ariaLabel="Toggle Dark Mode"
              onLabel="🌙"
              offLabel="☀️"
            />

            {/* Dynamic Login / Logout Icon */}
            {isAuthenticated ? (
              <button onClick={handleLogout} className="hover:text-red-400 transition-colors" title="Logout">
                <LogOut size={20} />
              </button>
            ) : (
              <button onClick={() => openModal('login')} className="hover:text-accent transition-colors" title="Login">
                <LogIn size={20} />
              </button>
            )}
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
          <Link to="/" className="hover:text-accent transition-colors" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/dashboard" className="hover:text-accent transition-colors" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
          <Link to="/user" className="hover:text-accent transition-colors" onClick={() => setIsMenuOpen(false)}>Profile</Link>

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

          {/* Mobile Login / Logout Button */}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors pt-2 border-t border-gray-300/20"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={() => openModal('login')}
              className="flex items-center gap-2 text-accent hover:text-white transition-colors pt-2 border-t border-gray-300/20"
            >
              <LogIn size={20} />
              <span>Login</span>
            </button>
          )}
        </div>
      )}

      {/* The PopUp Component mapped to the states */}
      <LoginPopUp
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={modalView}
        onLoginSuccess={handleLoginSuccess}
      />
    </nav>
  );
}
