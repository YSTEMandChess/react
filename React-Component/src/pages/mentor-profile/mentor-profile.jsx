import React, { useEffect, useState } from 'react';
import './mentor-profile.css';

const MentorProfile = () => {
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState('');
    const [playLink, setPlayLink] = useState('play-nolog');
    const [recordingList, setRecordingList] = useState([]);
    const [signedURL, setSignedURL] = useState('');
    const [showPdfListView, setShowPdfListView] = useState(false);
    const [sharedPdfList, setSharedPdfList] = useState([]);
    const [categoryName, setCategoryName] = useState('');

    useEffect(() => {
        const init = async () => {
            // Simulating cookie retrieval and other initialization logic
            let uInfo = await setPermissionLevel(); // Mock this function to retrieve user info
            setUsername(uInfo.username);
            setFirstName(uInfo.firstName);
            setLastName(uInfo.lastName);
            setRole(uInfo.role);
            setPlayLink(uInfo.role === 'mentor' ? 'play-mentor' : 'play-nolog');
            document.getElementById("defaultOpen").click();
            document.getElementById("student3").click();
            document.getElementById("defaultOpen2").click();
            document.getElementById("defaultOpenStudent").click();
        };
        init();
    }, []);

    const openCity = (evt, cityName) => {
        const tabcontent = document.getElementsByClassName("tabcontent");
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        const tablinks = document.getElementsByClassName("tablinks");
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(cityName).style.display = "block";
        evt.currentTarget.className += " active";
    };

    const openStudent = (evt, cityName) => {
        const tabcontent = document.getElementsByClassName("tabcontent1");
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        const stablinks = document.getElementsByClassName("stablinks");
        for (let i = 0; i < stablinks.length; i++) {
            stablinks[i].className = stablinks[i].className.replace(" active", "");
        }
        document.getElementById(cityName).style.display = "block";
        evt.currentTarget.className += " active";
    };

    const openStudentInfo = (evt, cityName) => {
        const tabcontent = document.getElementsByClassName("tabcontent2");
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        const tablinks = document.getElementsByClassName("tablinks");
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(cityName).style.display = "block";
        evt.currentTarget.className += " active";
    };

    const studentDetails = (event, studentName) => {
        const mainTabcontent = document.getElementsByClassName("mainTabcontent");
        for (let i = 0; i < mainTabcontent.length; i++) {
            mainTabcontent[i].style.display = "none";
        }
        const tablinks = document.getElementsByClassName("tablinks");
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(studentName).style.display = "block";
        event.currentTarget.className += " active";
    };

    const getPresignURL = (sid, meetingId) => {
        // Simulate URL fetching and set the signed URL
        const filename = `${sid}_${meetingId}_0.mp4`;
        const url = `${environment.urls.middlewareURL}/meetings/singleRecording?filename=${filename}`;
        setSignedURL(url);
        if (signedURL) {
            window.open(signedURL);
        }
    };

    const showSharedSlideShowPdfList = (catId, catName) => {
        setShowPdfListView(true);
        setCategoryName(catName);
        // Set the shared PDF list based on category ID
        switch (catId) {
            case '1':
                setSharedPdfList([
                    { id: '1', FileName: 'Mantra 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
                    // Add more items...
                ]);
                break;
            case '2':
                setSharedPdfList([
                    { id: '1', FileName: 'Exercise 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
                    // Add more items...
                ]);
                break;
            // Handle other categories similarly
            default:
                setSharedPdfList([
                    { id: '1', FileName: 'demo 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
                ]);
        }
    };

    return (
        <div className="mentor-profile">
            <div className="userProfileDiv">
                <div className="container text-center mb-4">
                    <img className="user-img" src="/assets/images/mentor-profile/user.PNG" alt="User" />
                    <h2>Hello, {firstName} {lastName}!</h2>
                </div>
                <div className="container">
                    <div className="row mentor-section">
                        <div className="student-tab">
                            <button className="tablinks tablinks1" onClick={(e) => studentDetails(e, 'Studentname1')} id="defaultOpenStudent">Student Name 1</button>
                            <button className="tablinks tablinks2" onClick={(e) => studentDetails(e, 'Studentname2')}>Student Name 2</button>
                            <button className="tablinks tablinks3" onClick={(e) => studentDetails(e, 'Studentname3')}>Student Name 3</button>
                        </div>

                        <div id="Studentname1" className="mainTabcontent">
                            {/* Content for Studentname1 */}
                        </div>
                        <div id="Studentname2" className="mainTabcontent">
                            {/* Content for Studentname2 */}
                        </div>
                        <div id="Studentname3" className="mainTabcontent">
                            {/* Content for Studentname3 */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorProfile;
