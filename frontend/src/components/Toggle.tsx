import React from 'react';

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  ariaLabel?: string;
  // Two new optional props so we can pass any icon or text inside!
  onLabel?: React.ReactNode; 
  offLabel?: React.ReactNode;
}

export default function Toggle({ 
  isOn, 
  onToggle, 
  ariaLabel = "Toggle switch",
  onLabel,
  offLabel
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={ariaLabel}
      onClick={onToggle}
      // Added 'relative' so the icons inside can be absolute positioned
      // Increased size slightly to w-16 and h-8 to fit emojis perfectly
      className={`relative w-16 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-accent ${
        isOn ? 'bg-background-dark' : 'bg-accent'
      }`}
    >
      {/* The ON Label (Left side, visible when toggle is ON) */}
      <div className={`absolute left-2 text-sm transition-opacity duration-300 ${isOn ? 'opacity-100' : 'opacity-0'}`}>
        {onLabel}
      </div>

      {/* The OFF Label (Right side, visible when toggle is OFF) */}
      <div className={`absolute right-2 text-sm transition-opacity duration-300 ${isOn ? 'opacity-0' : 'opacity-100'}`}>
        {offLabel}
      </div>

      {/* The sliding circle (Added z-10 so it always glides ABOVE the icons) */}
      <div
        className={`z-10 bg-text-default w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
          isOn ? 'translate-x-8' : 'translate-x-0'
        }`}
      />
    </button>
  );
}