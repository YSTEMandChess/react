import React from 'react';
// import { FaUserCircle} from "react-icons/fa";
// import type { IconType } from 'react-icons'; // Import type for icons
// const UserIcon = FaUserCircle as IconType;

export default function ProfileHeader({
  firstName,
  lastName,
  profilePicture,
}) {
  return (
        <>
            <div className="mentor-profile">
            <div className="mentor-profile-header">
                {profilePicture ? (
                <img
                    src={profilePicture}
                    alt="Profile"
                    className="mentor-profile-picture" // When a profile picture updoad is supported, it can be styled with this class
                />
                ) : (
                <>
                    {// @ts-ignore
                    // If someone can figure out how to make this work without the ts-ignore, please do so
                    // <UserIcon className="mentor-placeholder-icon" /> 
                    }
                </>
                )}
                <h2 className="greeting">Hello, {firstName} {lastName}!</h2>
            </div>
            </div>
        </>
    )
}