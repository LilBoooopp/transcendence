import React, { useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Pencil, Check, X, Camera, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import Button from '../components/Button'

export interface ProfileTileProps {
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	bio: string;
	avatarUrl?: string;
	onUpdateField: (field: string, newValue: string) => void; 
	onUploadAvatar: (file: File) => Promise<void>;
	// NEW PROPS: Pass these down from ProfilePage.tsx to handle the backend logic
	onChangePassword: (oldPass: string, newPass: string) => Promise<void>;
	onDeleteAccount: () => Promise<void>;
}

function EditableField({ 
	label, 
	value, 
	onSave 
}: { 
	label: string; 
	value: string; 
	onSave: (val: string) => void 
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [draftValue, setDraftValue] = useState(value);

	const handleSave = () => {
		onSave(draftValue);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setDraftValue(value);
		setIsEditing(false);
	};

	if (isEditing) {
		return (
			<div className="flex items-center gap-2 mt-2">
				<span className="text-sm font-bold w-24 text-text-default">{label}:</span>
				<input 
					type="text" 
					value={draftValue}
					onChange={(e) => setDraftValue(e.target.value)}
					className="rounded px-2 py-1 flex-grow text-sm text-text-dark"
					autoFocus
				/>
				<button onClick={handleSave} className="text-green-600 font-bold hover:text-green-800 text-sm"><Check size={20}/></button>
				<button onClick={handleCancel} className="text-red-600 font-bold hover:text-red-800 text-sm"><X size={20}/></button>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2 mt-2 group">
			<span className="text-sm w-24 text-text-default">{label}:</span>
			<span className="text-sm font-bold text-text-default flex-grow truncate">{value}</span>
			
			<button className="text-text-default hover:text-accent transition-colors"
				onClick={() => setIsEditing(true)}
			>
				<Pencil size={16} />
			</button>
		</div>
	);
}

export default function ProfileTile({ 
	username, 
	email, 
	firstName, 
	lastName, 
	bio, 
	avatarUrl, 
	onUpdateField,
	onUploadAvatar,
	onChangePassword,
	onDeleteAccount
}: ProfileTileProps) {
	
	// States for Modals
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	// States for Password Change
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [passwordError, setPasswordError] = useState('');

	const placeholderImage = "https://ui-avatars.com/api/?name=" + username + "&background=random";
	const avatarSrc = avatarUrl && avatarUrl.trim() !== '' ? `/api/uploads/${avatarUrl}` : placeholderImage;

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleOverlayClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			try {
				await onUploadAvatar(file);
			} catch (error) {
				console.error('Avatar upload failed', error);
			} finally {
				event.target.value = '';
			}
		}
	};

	const handleSubmitPassword = async () => {
		setPasswordError('');
		if (newPassword !== confirmPassword) {
			setPasswordError("New passwords do not match.");
			return;
		}
		if (newPassword.length < 6) {
			setPasswordError("New password must be at least 6 characters.");
			return;
		}
		
		try {
			await onChangePassword(oldPassword, newPassword);
			// Reset and close on success
			setOldPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setIsPasswordModalOpen(false);
		} catch (err) {
			setPasswordError("Failed to change password. Please check your old password.");
		}
	};

	return (
		<>
			<Card variant="surface" className="flex flex-col md:flex-row items-start p-6 gap-6 w-full cursor-default relative">
				{/* Profile Picture */}
				<div className="flex-shrink-0 relative group cursor-pointer" onClick={handleOverlayClick}>
					<img
						src={avatarSrc}
						alt={`${username}'s avatar`}
						className="w-24 h-24 rounded-full object-cover shadow-sm border-2 border-accent"
					/>
					<div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
						<Camera className="text-white" size={28} />
					</div>
					<input 
						type="file" 
						ref={fileInputRef} 
						onChange={handleFileChange} 
						accept="image/png, image/jpeg, image/jpg" 
						className="hidden" 
					/>
				</div>

				{/* Editable Text */}
				<div className="flex flex-col flex-grow w-full overflow-hidden">
					<h3 className="text-2xl font-heading font-bold text-text-default mb-2 truncate">
						Profile Details
					</h3>       
					<EditableField label="Username" value={username} onSave={(newVal) => onUpdateField('username', newVal)} />
					<EditableField label="Email" value={email} onSave={(newVal) => onUpdateField('email', newVal)} />
					<EditableField label="First Name" value={firstName} onSave={(newVal) => onUpdateField('firstName', newVal)} />
					<EditableField label="Last Name" value={lastName} onSave={(newVal) => onUpdateField('lastName', newVal)} />
					<EditableField label="Bio" value={bio} onSave={(newVal) => onUpdateField('bio', newVal)} />

					{/* Action Buttons */}
					<div className="flex gap-4 mt-6 pt-4 border-t border-gray-400/20">
						<Button variant="secondary"
							onClick={() => setIsPasswordModalOpen(true)}
							className="px-4 py-2 text-sm"
						>
							Change Password
						</Button>
						<Button variant="tertiary"
							onClick={() => setIsDeleteModalOpen(true)}
							className="px-4 py-2 text-sm"
						>
							Delete Account
						</Button>
					</div>
				</div>
			</Card>

			{/* --- PASSWORD CHANGE MODAL --- */}
			{isPasswordModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
					<div className="bg-primary rounded-xl shadow-lg p-6 w-full max-w-sm">
						<h2 className="text-xl font-heading font-bold text-text-default mb-4">Change Password</h2>
						
						<div className="flex flex-col gap-3">
							<input 
								type="password" 
								placeholder="Old Password" 
								value={oldPassword}
								onChange={(e) => setOldPassword(e.target.value)}
								className="rounded px-3 py-2 text-text-dark bg-background-light"
							/>
							<input 
								type="password" 
								placeholder="New Password" 
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="rounded px-3 py-2 text-text-dark bg-background-light"
							/>
							<input 
								type="password" 
								placeholder="Confirm New Password" 
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="rounded px-3 py-2 text-text-dark bg-background-light"
							/>
						</div>

						{passwordError && <p className="text-red-400 text-sm mt-2">{passwordError}</p>}

						<div className="flex justify-end gap-3 mt-6">
							<Button variant="tertiary"
								onClick={() => setIsPasswordModalOpen(false)}
								className="px-4 py-2 flex-1"
							>
								Cancel
							</Button>
							<Button variant="secondary"
								onClick={handleSubmitPassword}
								className="px-4 py-2 flex-1"
							>
								Save
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* --- DELETE ACCOUNT MODAL --- */}
			{isDeleteModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
					<div className="bg-primary rounded-xl shadow-lg p-6 w-full max-w-sm text-center">
						<AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
						<h2 className="text-xl font-heading font-bold text-text-default mb-2">Delete Account?</h2>
						<p className="text-text-default/80 text-sm mb-6">
							Are you sure you want to remove your account? You will permanently lose all data related to this account. This action cannot be undone.
						</p>

						<div className="flex justify-center gap-4">
							<Button variant="secondary"
								onClick={() => setIsDeleteModalOpen(false)}
								className="px-4 py-2 flex-1"
							>
								Back
							</Button>
							<Button variant="tertiary"
								onClick={async () => {
									await onDeleteAccount();
									setIsDeleteModalOpen(false);
								}}
								className="px-4 py-2 flex-1"
							>
								Delete
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}