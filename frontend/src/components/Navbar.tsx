import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Toggle from './Toggle';
import { Menu, X, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import LoginPopUp from './LoginPopUp';
import { socketService } from '../services/socket.service';

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({ isDarkMode, toggleDarkMode }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'register'>('login');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    if (token) {
      socketService.connect();
      fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => setIsAdmin(data?.role === 'ADMIN'))
        .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setIsAdmin(false);
    socketService.disconnect();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
    setIsMenuOpen(false);
  };

  const openModal = (view: 'login' | 'register') => {
    setModalView(view);
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <nav className="relative bg-primary text-text-default shadow-md transition-colors duration-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* LOGO */}
        <Link to="/" className="text-2xl font-heading font-bold">42 Chess</Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden md:flex items-center gap-8 font-body font-medium">
          <div className="flex gap-6 items-center">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <Link to="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
            <Link to="/user" className="hover:text-accent transition-colors">Profile</Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-accent hover:text-accent/70 transition-colors font-semibold"
                title="Admin panel"
              >
                <ShieldAlert size={16} />
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-6">
            <Toggle
              isOn={isDarkMode}
              onToggle={toggleDarkMode}
              ariaLabel="Toggle Dark Mode"
              onLabel="🌙"
              offLabel="☀️"
            />
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
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-accent font-semibold hover:text-accent/70 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShieldAlert size={16} />
              Admin Panel
            </Link>
          )}

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

      <LoginPopUp
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={modalView}
        onLoginSuccess={handleLoginSuccess}
      />
    </nav>
  );
}
