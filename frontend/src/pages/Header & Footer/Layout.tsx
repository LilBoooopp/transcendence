import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer"; // Import the Footer
import { useDarkMode } from '../../hooks/darkMode'

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Notice the flex flex-col min-h-screen which naturally pushes the mt-auto footer to the bottom
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

      <Navbar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>

      {/* Add the Footer here */}
      <Footer />

    </div>
  );
}