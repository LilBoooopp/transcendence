import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	variant?: 'primary' | 'secondary' | 'accent';
}

export default function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
	const baseClasses = `px-6 py-3 rounded-lg font-body font-semibold transition-all duration-200 shadow-sm`;

	const variants = {
		primary: "bg-primary hover:bg-primary-hover text-text-default",
		secondary: "bg-secondary hover:bg-secondary-hover text-text-default",
		accent: "bg-accent hover:bg-accent-hover text-text-dark"
	};

	return (
		<button
			// 2. Safely add the incoming className to the end of your string
			className={`${baseClasses} ${variants[variant]} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}