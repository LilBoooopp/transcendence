import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AuthModalProps
{
	isOpen: boolean;
	onClose: () => void;
	initialView?: 'login' | 'register'; 
	onLoginSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, initialView = 'login', onLoginSuccess }: AuthModalProps) {
	const [isLoginView, setIsLoginView] = useState(initialView === 'login');
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		email: '',
	});

	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Regex for each fields
	const usernameRegex = /^[a-zA-Z0-9_-]+$/;
	const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;:,.<>?]+$/;
	const emailRegex = /^((?:[A-Za-z0-9!#$%&'*+\-\/=?^_`{|}~]|(?<=^|\.)"|"(?=$|\.|@)|(?<=".*)[ .](?=.*")|(?<!\.)\.){1,64})(@)((?:[A-Za-z0-9.\-])*(?:[A-Za-z0-9])\.(?:[A-Za-z0-9]){2,})$/gm

	const validateForm = (): string | null => {
	    const { username, password, email } = formData;
		console.log('Validating form with:', { username, password, email });

		if (!email.includes('@') || !email.includes('.') || !emailRegex.test(email)) {
	        return 'Please enter a valid email address';
	    }
	    if (username.length < 3 || username.length > 20) {
	        return 'Username must be between 3 and 20 characters';
	    }
	    if (!usernameRegex.test(username)) {
	        return 'Username can only contain letters, numbers, or "_" and "-"';
	    }

	    if (password.length < 8 || password.length > 64) {
	        return 'Password must be between 8 and 64 characters';
	    }
	    if (!passwordRegex.test(password)) {
	        return 'Password can only contain letters, digits, and special characters !@#$%^&*()_+-=[]{}|;:,.<>?';
	    }

	    return null;
	};

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
		setError('');

		// Validate form before submitting
		const validationError = validateForm();
		if (validationError) {
			setError(validationError);
			setIsLoading(false);
			return;
		}
		
		try {
			const url = isLoginView ? '/api/auth/login' : '/api/auth/register';
			const body = isLoginView
				? { username: formData.username, password: formData.password }
				: { username: formData.username, password: formData.password, email: formData.email };

			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Something went wrong');
			}
			localStorage.setItem('token', data.accessToken);
			setFormData({ username: '', password: '', email: '' });
			onClose();
			onLoginSuccess?.();
			window.location.reload();
		} catch (err: any) {
			setError(err.message || 'Something went wrong');
		} finally {
			setIsLoading(false);
		}
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
							minLength={5}
							maxLength={254}
							pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
							title="Please enter a valid email address"
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
						minLength={3}
						maxLength={20}
						pattern="^[a-zA-Z0-9_\-]+$"
						title="Letters, numbers, underscores and hyphens only"
						className="p-3 border rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
						required
					/>
					
					<input
						type="password"
						name="password"
						placeholder="Password"
						value={formData.password}
						onChange={handleChange}
						minLength={8}
						maxLength={64}
						pattern="^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;:,.<>?]+$"
						title="Letters, digits, and special characters !@#$%^&*()_+-=[]{}|;:,.<>? only"
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