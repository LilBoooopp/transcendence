import React, { useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Pencil, Check, X, Camera } from 'lucide-react'; // Added Camera

export interface ProfileTileProps {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl?: string;
  onUpdateField: (field: keyof ProfileTileProps, newValue: string) => void; 
  onUploadAvatar: (file: File) => Promise<void>;
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
      
      <button className="text-text-default hover:text-accent"
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
}: ProfileTileProps) {


  const placeholderImage = "https://ui-avatars.com/api/?name=" + username + "&background=random";
	//avatar add by syl
  const avatarSrc =
    avatarUrl && avatarUrl.trim() !== ''
      ? `/api/uploads/${avatarUrl}`
      : placeholderImage;

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

  return (
    <Card variant="surface" className="flex flex-col md:flex-row items-start p-6 gap-6 w-full cursor-default">
      {/* Profile Picture */}
      <div className="flex-shrink-0 relative group cursor-pointer" onClick={handleOverlayClick}>
        <img
			src={avatarSrc}
      alt={`${username}'s avatar`}
      className="w-24 h-24 rounded-full object-cover shadow-sm border-2 border-accent"
          /*src={avatarUrl || placeholderImage}
          alt={`${username}'s avatar`}
          className="w-24 h-24 rounded-full object-cover shadow-sm border-2 border-acce"*/
        />
        
        {/* Camera Overlay */}
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Camera className="text-white" size={28} />
        </div>

        {/* Hidden File Input */}
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
        {/* Render Editable Fields */}
        <EditableField 
          label="Username" 
          value={username} 
          onSave={(newVal) => onUpdateField('username', newVal)} 
        />
        <EditableField 
          label="Email" 
          value={email} 
          onSave={(newVal) => onUpdateField('email', newVal)} 
        />
        <EditableField 
          label="First Name" 
          value={firstName} 
          onSave={(newVal) => onUpdateField('firstName', newVal)} 
        />
        <EditableField 
          label="Last Name" 
          value={lastName} 
          onSave={(newVal) => onUpdateField('lastName', newVal)} 
        />
        <EditableField 
          label="Bio" 
          value={bio} 
          onSave={(newVal) => onUpdateField('bio', newVal)} 
        />
      </div>
    </Card>
  );
}