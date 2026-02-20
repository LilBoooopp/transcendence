import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function WireframeLayout({ children }: LayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col">
      
      <Navbar 
        isDarkMode={isDarkMode} 
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>

    </div>
  );
}