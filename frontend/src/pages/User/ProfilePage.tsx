import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileTile from '../../components/ProfileTile';

type ProfileData = {
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	bio: string;
	avatarUrl: string;
};

type UpdateUserBody = {
	username?: string;
	bio?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
};

const ProfilePage = () => {
	const navigate = useNavigate();

	const [profileData, setProfileData] = useState<ProfileData>({
		username: '',
		email: '@example.com',
		firstName: '',
		lastName: '',
		bio: '',
		avatarUrl: '',
	});

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) return;

		fetch('/api/users/me', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => {
				if (!res.ok) throw new Error('Not ok');
				return res.json();
			})
			.then((user) => {
				setProfileData({
					username: user.username ?? '',
					email: user.email ?? '',
					firstName: user.firstName ?? '',
					lastName: user.lastName ?? '',
					bio: user.bio ?? '',
					avatarUrl: user.avatarUrl ?? '',
				});
			})
			.catch(() => {
				// handle error if needed
			});
	}, []);

	const handleUpdateProfileField = async (field: string, newValue: string) => {
		const token = localStorage.getItem('token');
		const previous = profileData;

		setProfileData((prev) => ({
			...prev,
			[field]: newValue,
		}));

		const body: UpdateUserBody = {};
		if (field === 'username') body.username = newValue;
		if (field === 'email') body.email = newValue;
		if (field === 'firstName') body.firstName = newValue;
		if (field === 'lastName') body.lastName = newValue;
		if (field === 'bio') body.bio = newValue;

		if (Object.keys(body).length === 0) {
			console.log(`Field "${field}" not yet handled by backend.`);
			return;
		}

		try {
			if (!token) throw new Error('No token');

			const res = await fetch('/api/users', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(body),
			});

			if (!res.ok) throw new Error('PATCH failed');
			const data = await res.json();

			if (data.accessToken) {
        		localStorage.setItem('token', data.accessToken);
      		}

			console.log(`Updated ${field} to: ${newValue} in database!`);
		} catch (error) {
			setProfileData(previous);
			console.error('Error on PATCH /api/users', error);
		}
	};

	const handleAvatarUpload = async (file: File) => {
		const token = localStorage.getItem('token');
		if (!token) throw new Error('No token');

		const formData = new FormData();
		formData.append('avatar', file);

		const res = await fetch('/api/users/avatar', {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		});

		if (!res.ok) {
			throw new Error('Avatar upload failed');
		}

		const updatedUser = await res.json();
		setProfileData((prev) => ({
			...prev,
			avatarUrl: updatedUser.avatarUrl ?? prev.avatarUrl,
		}));
	};

	// --- NEW: Change Password Logic ---
	const handleChangePassword = async (oldPassword: string, newPassword: string) => {
		const token = localStorage.getItem('token');
		if (!token) throw new Error('No token');

		// Note: Adjust the URL '/api/users/password' based on your actual NestJS backend route
		const res = await fetch('/api/users/password', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ oldPassword, newPassword }),
		});

		if (!res.ok) {
			throw new Error('Failed to update password');
		}
		
		console.log('Password successfully changed');
	};

	// --- NEW: Delete Account Logic ---
	const handleDeleteAccount = async () => {
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			// Note: Adjust the URL '/api/users/me' based on your actual NestJS backend route
			const res = await fetch('/api/users/me', {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				throw new Error('Failed to delete account');
			}

			// Clear the token and kick the user back to the landing page
			localStorage.removeItem('token');
			navigate('/');
			console.log('Account deleted');
		} catch (error) {
			console.error('Error deleting account:', error);
		}
	};

	return (
		
		<div className="flex flex-col gap-8 items-center w-full max-w-4xl mx-auto py-8 px-4">
			<div className="w-full flex justify-center">
				<ProfileTile
					username={profileData.username}
					email={profileData.email}
					firstName={profileData.firstName}
					lastName={profileData.lastName}
					bio={profileData.bio}
					avatarUrl={profileData.avatarUrl}
					onUpdateField={handleUpdateProfileField}
					onUploadAvatar={handleAvatarUpload}
					onChangePassword={handleChangePassword}
					onDeleteAccount={handleDeleteAccount}
				/>
			</div>
		</div>
	);
};

export default ProfilePage;