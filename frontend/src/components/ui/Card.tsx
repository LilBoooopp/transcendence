import React, { ReactNode } from 'react';

interface CardProps {
	children: ReactNode;
	className?: string;
	onClick?: () => void;
	variant?: 'primary' | 'surface'; // Add variants here
}

export const Card: React.FC<CardProps> = ({ 
	children, 
	className = '', 
	onClick, 
	variant = 'primary' 
}) => {
	const baseClasses = "rounded-xl shadow-md transition-all duration-200";
	const interactiveClasses = onClick ? "cursor-pointer hover:shadow-lg" : "";
	
	const variants = {
		primary: "bg-primary hover:bg-primary-hover text-text-default",
		// Surface is for static layout containers (white bg, subtle border)
		surface: "bg-white border border-accent/30 text-text-dark" 
	};

	return (
		<div 
			onClick={onClick}
			className={`${baseClasses} ${variants[variant]} ${interactiveClasses} ${className}`}
		>
			{children}
		</div>
	);
};