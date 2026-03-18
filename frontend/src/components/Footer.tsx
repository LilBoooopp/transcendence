import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-primary text-text-default py-3 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-center items-center">
        <div className="flex space-x-6 text-sm">
          <Link to="/privacy-policy" className="hover:text-accent transi">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="hover:text-accent transition">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}