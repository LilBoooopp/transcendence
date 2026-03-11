import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AuthModalProps
{
	isOpen: boolean;
	onClose: () => void;
	initialView?: 'login' | 'register'; 
}

export default function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
	const [isLoginView, setIsLoginView] = useState(initialView === 'login');
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		email: '',
	});

	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Effect to check changing state
	useEffect(() => {
		if (isOpen) {
			setIsLoginView(initialView === 'login');
			setError(''); 
		}
	}, [isOpen, initialView]);

	// Background scroll lock and esc key handling
	useEffect(() => {
		const handleEscapeKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};

		if (isOpen) {
			document.body.style.overflow = 'hidden';
			window.addEventListener('keydown', handleEscapeKey);
		} else {
			document.body.style.overflow = 'unset';
			window.removeEventListener('keydown', handleEscapeKey);
		}
		return () => {
			document.body.style.overflow = 'unset';
			window.removeEventListener('keydown', handleEscapeKey);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		setError(''); 
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

    // ==========================================
    // TODO FOR BACKEND INTEGRATION:
    // 1. Check `isLoginView` to know if you should call /auth/login or /auth/register
    // 2. The data is stored in `formData` (formData.username, formData.password, etc.)
    // 3. Make the fetch() request to the NestJS API here.
    // 4. If success: Save the JWT token, clear the form, and call onClose()
    // 5. If error: Call setError("The error message from backend")
    // ==========================================

		console.log("Form submitted! View:", isLoginView ? "Login" : "Register");
		console.log("Data ready for backend:", formData);

		setTimeout(() => setIsLoading(false), 500); 
  };

  return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="relative w-full max-w-md p-8 bg-white shadow-2xl rounded-xl dark:bg-slate-800">
				
				{/* Close Button */}
				<button 
					onClick={onClose} 
					className="absolute transition-colors text-slate-400 top-4 right-4 hover:text-slate-600 dark:hover:text-slate-200"
				>
					<X size={24} />
				</button>

				{/* Dynamic Title */}
				<h2 className="mb-6 text-3xl font-bold text-center text-slate-800 dark:text-white font-heading">
					{isLoginView ? 'Welcome Back' : 'Create Account'}
				</h2>

				{/* Error Message Display */}
				{error && (
					<div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
						{error}
					</div>
				)}

				{/* Form */}
				<form onSubmit={handleSubmit} className="flex flex-col gap-4 font-body">
					{!isLoginView && (
						<input
							type="email"
							name="email"
							placeholder="Email Address"
							value={formData.email}
							onChange={handleChange}
							className="p-3 border rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
							required
						/>
					)}
					
					<input
						type="text"
						name="username"
						placeholder="Username"
						value={formData.username}
						onChange={handleChange}
						className="p-3 border rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
						required
					/>
					
					<input
						type="password"
						name="password"
						placeholder="Password"
						value={formData.password}
						onChange={handleChange}
						className="p-3 border rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
						required
					/>
					
					<button 
						type="submit" 
						disabled={isLoading}
						className="p-3 mt-4 font-bold text-white transition-colors rounded-lg bg-accent hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
					</button>
				</form>

				{/* Toggle View Footer */}
				<div className="mt-6 text-center text-slate-600 dark:text-slate-400 font-body">
					{isLoginView ? "Don't have an account? " : "Already have an account? "}
					<button 
						type="button" 
						onClick={() => {
							setIsLoginView(!isLoginView);
							setError(''); 
						}} 
						className="font-semibold text-accent hover:underline"
					>
						{isLoginView ? 'Register' : 'Login'}
					</button>
				</div>

			</div>
		</div>
	);
}