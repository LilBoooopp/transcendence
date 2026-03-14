import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import ProfileTile from '../../components/ProfileTile'; 

const ProfilePage = () => {
	const [profileData, setProfileData] = useState({
		username: "lilboooopp",
		email: "lilboooopp@example.com",
		firstName: "Lil",
		lastName: "Boo",
		bio: "I love playing chess and building web apps!",
		avatarUrl: ""
	});

	const handleUpdateProfileField = (field: string, newValue: string) => {
		setProfileData((prevData) => ({
			...prevData,
			[field]: newValue
		}));

		// TODO: Send this to your backend!
		// Example:
		// fetch('/api/users/update', { 
		//   method: 'PATCH', 
		//   body: JSON.stringify({ [field]: newValue }) 
		// }).catch(err => console.error("Failed to update db:", err));
		console.log(`Updated ${field} to: ${newValue} in database!`);
	};

	return (
		<div className="flex flex-col gap-8 items-center w-full max-w-4xl mx-auto py-8 px-4">
			
			{/* TOP SECTION: User Profile Tile */}
			<div className="w-full flex justify-center">
				<ProfileTile 
					username={profileData.username}
					email={profileData.email}
					firstName={profileData.firstName}
					lastName={profileData.lastName}
					bio={profileData.bio}
					avatarUrl={profileData.avatarUrl}
					onUpdateField={handleUpdateProfileField}
				/>
			</div>
		</div>
	);
};

export default ProfilePage;