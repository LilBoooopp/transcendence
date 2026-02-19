import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
}

export default function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  // Base styles applied to all buttons
  const baseClasses = "px-6 py-3 rounded-lg font-body font-semibold transition-colors duration-200 shadow-sm";

  // The specific colors from your corporate design
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-text-default",
    secondary: "bg-secondary hover:bg-secondary-hover text-text-default",
    accent: "bg-accent hover:bg-accent-hover text-text-dark"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]}`} 
      {...props}
    >
      {children}
    </button>
  );
}