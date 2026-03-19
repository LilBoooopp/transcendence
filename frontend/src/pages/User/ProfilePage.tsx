import React, { useState, useEffect } from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import ProfileTile from '../../components/ProfileTile';
import { useNotification } from "../../notifications";

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
	const { userData } = useLoaderData() as any;
	const { push } = useNotification();


    const [profileData, setProfileData] = useState<ProfileData>({
        username: userData?.username ?? '',
        email: userData?.email ?? '',
        firstName: userData?.firstName ?? '',
        lastName: userData?.lastName ?? '',
        bio: userData?.bio ?? '',
        avatarUrl: userData?.avatarUrl ?? '',
    });

	const handleUpdateProfileField = async (field: string, newValue: string) => {
	    const token = localStorage.getItem('token');
		const usernameRegex = /^[a-zA-Z0-9_-]+$/;

	    if (field === 'username') {
	        newValue = newValue.toLowerCase().trim();
			if (usernameRegex.test(newValue) === false) {
				push({ type: 'error', title: 'Invalid username', message: 'Username can only contain letters, numbers, and underscores.' });
				return;
			}
	    }
		if (field === 'email') {
			newValue = newValue.trim();
			const emailRegex = /^((?:[A-Za-z0-9!#$%&'*+\-\/=?^_`{|}~]|(?<=^|\.)"|"(?=$|\.|@)|(?<=".*)[ .](?=.*")|(?<!\.)\.){1,64})(@)((?:[A-Za-z0-9.\-])*(?:[A-Za-z0-9])\.(?:[A-Za-z0-9]){2,})$/gm;
			if (!emailRegex.test(newValue)) {
				push({ type: 'error', title: 'Invalid email', message: 'Please enter a valid email address.' });
				return;
			}
		}
		if (field === 'firstName' || field === 'lastName') {
			newValue = newValue.trim();
			if (usernameRegex.test(newValue) === false) {
				push({ type: 'error', title: 'Invalid name', message: 'Names can only contain letters, numbers, and underscores.' });
				return;
			}
		}
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

	        if (res.status === 401) {
	            localStorage.removeItem('token');
	            navigate('/login');
	            return;
	        }

	        if (!res.ok) throw new Error('PATCH failed');

	        push({ type: 'success', title: 'Saved', message: `${field} updated successfully.` });
	    } catch (error) {
	        setProfileData(previous);
	        push({ type: 'error', title: 'Update failed', message: `Could not update ${field}.` });
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
		//refresh new avatar
		setProfileData((prev) => ({
			...prev,
			avatarUrl: updatedUser.avatarUrl ?? prev.avatarUrl,
		}));
	};

	const handleChangePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
	    const token = localStorage.getItem('token');
	    if (!token) return { success: false, message: 'No token' };
	
	    try {
	        const res = await fetch('/api/users/password', {
	            method: 'PATCH',
	            headers: {
	                'Content-Type': 'application/json',
	                Authorization: `Bearer ${token}`,
	            },
	            body: JSON.stringify({ oldPassword, newPassword }),
	        });
		
	        if (!res.ok) {
	            const data = await res.json().catch(() => ({}));
	            return { success: false, message: data.message ?? 'Incorrect old password.' };
	        }
		
	        const data = await res.json();
	        if (data.accessToken) localStorage.setItem('token', data.accessToken);
		
	        return { success: true, message: 'Password changed successfully' };
	    } catch {
	        return { success: false, message: 'Network error.' };
	    }
	};


	const handleDeleteAccount = async () => {
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			const res = await fetch('/api/users/', {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				throw new Error('Failed to delete account');
			}
			localStorage.removeItem('token');
			navigate('/');
			console.log('Account deleted');
			push({ type: 'success', title: 'Account Deleted', message: 'Your account has been deleted successfully.' });
		} catch (error) {
			push({ type: 'error', title: 'Deletion Failed', message: 'There was an error deleting your account. Please try again later.' });
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