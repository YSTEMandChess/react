import React, { useEffect, useState } from 'react';
import { SetPermissionLevel } from '../../globals'; 
import { useCookies } from 'react-cookie';
import { environment } from '../../environments/environment';
import './StudentProfileRefactor.css';

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

export default function StudentProfileRefactor() {
    // cookies
    const [cookies] = useCookies(['login']);

    // user data
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [accountCreatedAt, setAccountCreatedAt] = useState('');
    const [role, setRole] = useState('');
    const [recordingList, setRecordingList] = useState([]);
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    // use effect to fetch user data
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
    
          if (!uInfo.error && (uInfo.role === 'mentor' || uInfo.role === 'student')) {
            fetchRecordings();
          }
        }
    
        fetchUserInfo();
    }, [cookies]);

    // fetch recordings
    function fetchRecordings() {
        const url = `${environment.urls.middlewareURL}/meetings/usersRecordings`;
        fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${cookies.login}`,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            setRecordingList(data);
          });
      };

      function addImage() {
        console.log("Add image clicked");
        // add logic to handle image upload
        // be sure to update the profilePicture state with the new image URL
      }

    return (
        <>
        <div className="student-profile-container">
            <div className="student-profile-header">
                {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="profile-picture" /> 
                ) : (
                    <img src="./defaultProfilePic.png" alt="Default Profile" className="profile-picture" onClick={addImage} />
                )}
                <h1 className="greeting">Hello, {firstName} {lastName}!</h1>
            </div>
        </div>
        </>
    )
}