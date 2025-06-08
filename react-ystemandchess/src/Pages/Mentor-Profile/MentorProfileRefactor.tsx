// React imports 
import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import ProfileHeader from './ProfileHeader';

// Styles
import './MentorProfileRefactor.css'; // Import the CSS file for styles

// Environment and services imports
import { environment } from '../../environments/environment';
import ViewSDKClient from '../../services/view-sdk.service'; // Adjust the path as necessary
import { SetPermissionLevel } from '../../globals'; // Adjust the path as necessary

//React icon imports
import type { IconType } from 'react-icons'; // Import type for icons
import { FaUserCircle} from "react-icons/fa";
const UserIcon = FaUserCircle as IconType; // Assign the icon to a variable
// import userImg from '../../assets/images/mentor-profile/user.PNG'; // This image no longer exists

type PdfItem = {
  id: string;
  FileName: string;
  FilePath: string;
};

type Record  = {
  sid: string;
  meetingId: string;
  meetingStartTime: string;
  [key: string]: any; // This allows any other fields to be added with any type
}

export default function MentorProfileRefactor() {
    // User state variables
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profilePicture, setProfilePicture] = useState(null); // Later, add functionality to upload a profile picture, then set the path with setProfilePicture in the useEffect
    const [username, setUsername] = useState('');
    const [accountCreatedAt, setAccountCreatedAt] = useState('');
    const [role, setRole] = useState('');
    const [logged, setLogged] = useState(false);
    const [recordingList, setRecordingList] = useState<Record[]>([]);

    // Cookies
    const [cookies] = useCookies(['login']);
    
    // Use effect on first render to set up the user info and fetch recordings
    useEffect(() => {
        async function fetchUserInfo() {
            const uInfo = await SetPermissionLevel(cookies);
            setUsername(uInfo.username);
            setFirstName(uInfo.firstName);
            setLastName(uInfo.lastName);
            setAccountCreatedAt(uInfo.accountCreatedAt);
            setRole(uInfo.role);

            // Wait for the DOM to be fully updated before accessing elements
            setTimeout(() => {
                const defaultOpen = document.getElementById('defaultOpen');
                const student3 = document.getElementById('student3');
                const defaultOpen2 = document.getElementById('defaultOpen2');
                const defaultOpenStudent = document.getElementById('defaultOpenStudent');

                if (defaultOpen) defaultOpen.click();
                if (student3) student3.click();
                if (defaultOpen2) defaultOpen2.click();
                if (defaultOpenStudent) defaultOpenStudent.click();
            }, 0);

            if (!uInfo.error) {
                setLogged(true);
            }

            if (uInfo.role === 'mentor') {
                fetchRecordings();
            }
        }

        fetchUserInfo();
    }, []);

    async function fetchRecordings() {
        const url = `${environment.urls.middlewareURL}/meetings/usersRecordings`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${cookies.login}`,
                },
            });
            const data = await response.json();
            setRecordingList(data);
        } catch (error) {
            console.error('Error fetching recordings:', error);
        }
    }

    return (
        <>
            <ProfileHeader
                firstName={firstName}  
                lastName={lastName}
                profilePicture={profilePicture}
            />
            
        </>
    )
}
