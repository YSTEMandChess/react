import React, { useState, useEffect } from 'react';
import './ParentProfile.css';
import studentGraph from '../../assets/images/mentor-profile/student-graph.PNG';
import userImage from '../../assets/images/mentor-profile/user.PNG';
import activityTab from '../../assets/images/student/activity_tab.png';
import mentorTab from '../../assets/images/student/mento_tab.PNG';
import prodevTab from '../../assets/images/student/prodev_tab.PNG';
import chessTab from '../../assets/images/student/chess_tab.PNG';
import gamesTab from '../../assets/images/student/games_tab.PNG';
import puzzlesTab from '../../assets/images/student/puzzles_tab.PNG';
import playTab from '../../assets/images/student/play_tab.PNG';
import recordingsTab from '../../assets/images/student/recordings_tab.PNG';

const ParentProfile = () => {
    const [selectedTab, setSelectedTab] = useState('Studentname1');
    const [selectedCity, setSelectedCity] = useState('Activity');
    const [selectedStudentTab, setSelectedStudentTab] = useState('Activity2');

    const handleStudentDetails = (studentName) => {
        setSelectedTab(studentName);
    };

    const handleCity = (cityName) => {
        setSelectedCity(cityName);
    };

    const handleStudentCity = (cityName) => {
        setSelectedStudentTab(cityName);
    };

    useEffect(() => {
        document.getElementById("defaultOpen").click();
        document.getElementById("student3").click();
        document.getElementById("defaultOpen2").click();
        document.getElementById("defaultOpenStudent").click();
    }, []);

    return (
        <div className="userProfileDiv">
            <div className="container">
                <div className="myDiv text-center mb-4">
                    <img className="user-img" src={userImage} alt="User" />
                    <h2>Hello, {`FirstName`} {`LastName`}!</h2>
                </div>
            </div>

            <div className="container">
                <div className="row mentor-section">
                    <div className="student-tab">
                        <button className="tablinks tablinks1" onClick={() => handleStudentDetails('Studentname1')} id="defaultOpenStudent">Student Name 1</button>
                        <button className="tablinks tablinks2" onClick={() => handleStudentDetails('Studentname2')}>Student Name 2</button>
                        <button className="tablinks tablinks3" onClick={() => handleStudentDetails('Studentname3')}>Student Name 3</button>
                    </div>

                    <div id="Studentname1" className={`mainTabcontent ${selectedTab === 'Studentname1' ? 'active' : ''}`}>
                        <div className="row mb-3">
                            <div className="col-12 col-md-7">
                                <div className="progressInfo">
                                    <img src={studentGraph} alt="Student Graph" />
                                </div>
                            </div>
                            <div className="col-12 col-md-5">
                                <div className="memberInfo">
                                    <h5 style={{ marginLeft: '-35px' }}><strong>Time Spent:</strong></h5>
                                    <p className="time-icon">Website: <strong>45 minutes</strong></p>
                                    <p className="time-icon">Lesson: <strong>10 minutes</strong></p>
                                    <p className="time-icon">Puzzle: <strong>5 minutes</strong></p>
                                    <p className="time-icon">Playing: <strong>15 minutes</strong></p>
                                    <p className="time-icon">Mentoring: <strong>15 minutes</strong></p>
                                </div>
                            </div>
                        </div>

                        <div className="tab">
                            <button className="tablinks tab1" onClick={() => handleCity('Activity')} id="defaultOpen"><img src={activityTab} alt="Activity Tab" /></button>
                            <button className="tablinks tab2" onClick={() => handleCity('Mentor_Session')}><img src={mentorTab} alt="Mentor Session Tab" /></button>
                            <button className="tablinks tab2" onClick={() => handleCity('Professional_Development')}><img src={prodevTab} alt="Professional Development Tab" /></button>
                            <button className="tablinks tab2" onClick={() => handleCity('Chess_Lession')}><img src={chessTab} alt="Chess Lesson Tab" /></button>
                            <button className="tablinks tab2" onClick={() => handleCity('Games')}><img src={gamesTab} alt="Games Tab" /></button>
                            <button className="tablinks tab2" onClick={() => handleCity('Puzzles')}><img src={puzzlesTab} alt="Puzzles Tab" /></button>
                            <button className="tablinks tab2" onClick={() => handleCity('computer')}><img src={playTab} alt="Computer Tab" /></button>
                            <button className="tablinks tab3" onClick={() => handleCity('Recordings')}><img src={recordingsTab} alt="Recordings Tab" /></button>
                        </div>

                        <div id="Activity" className={`tabcontent ${selectedCity === 'Activity' ? 'active' : ''}`}>
                            {/* Content for Activity tab */}
                        </div>
                        <div id="Mentor_Session" className={`tabcontent ${selectedCity === 'Mentor_Session' ? 'active' : ''}`}>
                            {/* Content for Mentor Session tab */}
                        </div>
                        {/* Add other tabs content similarly */}
                    </div>

                    {/* Add content for Studentname2 and Studentname3 similarly */}
                </div>

                {/* Add PDF Viewer and other necessary elements here */}
            </div>
        </div>
    );
};

export default ParentProfile;
