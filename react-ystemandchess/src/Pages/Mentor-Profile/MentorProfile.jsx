import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import './MentorProfile.scss'; // Import the SCSS file for styles
import { environment } from '../../environments/environment';
import ViewSDKClient from '../../services/view-sdk.service.js'; // Adjust the path as necessary
import { SetPermissionLevel } from '../../globals.js'; // Adjust the path as necessary


import {ChessWindow} from '../../ChessWidgets/ChessWindow.js';

const MentorProfile = () => {
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [accountCreatedAt, setAccountCreatedAt] = useState('');
    const [role, setRole] = useState('');
    const [logged, setLogged] = useState(false);
    const [recordingList, setRecordingList] = useState([]);
    const [signedURL, setSignedURL] = useState('');
    const [showData, setShowData] = useState(false);
    const [categoryList, setCategoryList] = useState([
      { id: '1', name: 'Mantra' },
      { id: '2', name: 'Exercise' },
      { id: '3', name: 'One Personal Development Lesson' },
      { id: '4', name: 'Chess Lesson' },
      { id: '5', name: 'Game' },
      { id: '6', name: 'Puzzles' },
    ]);
    const [sharedPdfList, setSharedPdfList] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [showPdfListView, setShowPdfListView] = useState(false);
    const [cookies] = useCookies(['login']);
  
    useEffect(() => {
      ViewSDKClient.ready().then(() => {
        ViewSDKClient.previewFile(
          '../../../assets/pdf/mentor/Y_STEM_Chess_Training_Lessons.pdf',
          'pdf-div',
          {
            embedMode: 'SIZED_CONTAINER',
            dockPageControls: false,
          }
        );
      });
  
      const fetchUserInfo = async () => {
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
      };
  
      fetchUserInfo();
    }, []);
  
    const fetchRecordings = () => {
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
  
    const openTab = (evt, tabName, className) => {
      const tabcontent = document.getElementsByClassName(className);
      for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
      }
      const tablinks = document.getElementsByClassName('tablinks');
      for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
      }
      document.getElementById(tabName).style.display = 'block';
      evt.currentTarget.className += ' active';
    };
  
    const showSharedSlideShowPdfList = (catId, catName) => {
      setShowPdfListView(true);
      setCategoryName(catName);
  
      let list = [];
      switch (catId) {
        case '1':
          list = [
            { id: '1', FileName: 'Mantra 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
            // Add more files as necessary
          ];
          break;
        case '2':
          list = [
            { id: '1', FileName: 'Exercise 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
            // Add more files as necessary
          ];
          break;
        case '3':
          list = [
            { id: '1', FileName: 'One Personal Development Lesson 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
            // Add more files as necessary
          ];
          break;
        case '4':
          list = [
            { id: '1', FileName: 'Chess Lesson 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
            // Add more files as necessary
          ];
          break;
        case '5':
          list = [
            { id: '1', FileName: 'Game 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
            // Add more files as necessary
          ];
          break;
        case '6':
          list = [
            { id: '1', FileName: 'Puzzles 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
            // Add more files as necessary
          ];
          break;
        default:
          list = [
            { id: '1', FileName: 'Demo 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
            // Add more files as necessary
          ];
          break;
      }
  
      setSharedPdfList(list);
    };
  
    const getPresignURL = (sid, meetingId) => {
      const filename = `${sid}_${meetingId}_0.mp4`;
      const url = `${environment.urls.middlewareURL}/meetings/singleRecording?filename=${filename}`;
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cookies.login}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setSignedURL(data);
          if (signedURL !== '') {
            window.open(signedURL);
          }
        });
    };

    return (
        <div className="userProfileDiv">
          <header>
            <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet" />
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css" rel="stylesheet" />
          </header>
          <div className="container">
            <div className="myDiv text-center mb-4">
              <img className="user-img" src="../../../assets/images/mentor-profile/user.PNG" alt="User" />
              <h2>Hello, {firstName} {lastName}!</h2>
            </div>
          </div>
      
          <div className="container">
            <div className="row mentor-section">
              <div className="student-tab">
                <button className="tablinks tablinks1" onClick={(e) => openTab(e, 'Studentname1', 'mainTabcontent')} id="defaultOpenStudent">Student Name 1</button>
                <button className="tablinks tablinks2" onClick={(e) => openTab(e, 'Studentname2', 'mainTabcontent')}>Student Name 2</button>
                <button className="tablinks tablinks3" onClick={(e) => openTab(e, 'Studentname3', 'mainTabcontent')}>Student Name 3</button>
              </div>
      
              <div id="Studentname1" className="mainTabcontent">
                <div className="row mb-3">
                  <div className="col-7">
                    <div className="progressInfo">
                      <img src="../../../assets/images/mentor-profile/student-graph.PNG" alt="Student Graph" />
                    </div>
                  </div>
                  <div className="col-5">
                    <div className="memberInfo">
                      <h5 style={{ marginLeft: '-35px' }}><strong>Time Spent:</strong></h5>
                      <p className="time-icon"><span className="website-icon"></span>&nbsp; Website: <strong>45 minutes</strong></p>
                      <p className="time-icon"><span className="website-icon"></span>&nbsp; Lesson: <strong>10 minutes</strong></p>
                      <p className="time-icon"><span className="website-icon"></span>&nbsp; Puzzle: <strong>5 minutes</strong></p>
                      <p className="time-icon"><span className="website-icon"></span>&nbsp; Playing: <strong>15 minutes</strong></p>
                      <p className="time-icon"><span className="website-icon"></span>&nbsp; Mentoring: <strong>15 minutes</strong></p>
                    </div>
                  </div>
                </div>
      
                <div className="tab">
                  <button className="tablinks tab1" onClick={(e) => openTab(e, 'Activity', 'tabcontent')} id="defaultOpen">
                    <img src="../../../assets/images/student/activity_tab.png" className="tab-image" alt="Activity Tab" />
                  </button>
                  <button className="tablinks tab2" onClick={(e) => openTab(e, 'Mentor_Session', 'tabcontent')}>
                    <img src="../../../assets/images/student/mento_tab.PNG" className="tab-image2" alt="Mentor Session Tab" />
                  </button>
                  <button className="tablinks tab2" onClick={(e) => openTab(e, 'Professional_Development', 'tabcontent')}>
                    <img src="../../../assets/images/student/prodev_tab.PNG" className="tab-image2" alt="Professional Development Tab" />
                  </button>
                  <button className="tablinks tab2" onClick={(e) => openTab(e, 'Chess_Lession', 'tabcontent')}>
                    <img src="../../../assets/images/student/chess_tab.PNG" className="tab-image2" alt="Chess Lesson Tab" />
                  </button>
                  <button className="tablinks tab2" onClick={(e) => openTab(e, 'Games', 'tabcontent')}>
                    <img src="../../../assets/images/student/games_tab.PNG" className="tab-image2" alt="Games Tab" />
                  </button>
                  <button className="tablinks tab2" onClick={(e) => openTab(e, 'Puzzles', 'tabcontent')}>
                    <img src="../../../assets/images/student/puzzles_tab.PNG" className="tab-image2" alt="Puzzles Tab" />
                  </button>
                  <button className="tablinks tab2" onClick={(e) => openTab(e, 'computer', 'tabcontent')}>
                    <img src="../../../assets/images/student/play_tab.PNG" className="tab-image2" alt="Computer Tab" />
                  </button>
                  <button className="tablinks tab3" onClick={(e) => openTab(e, 'Recordings', 'tabcontent')}>
                    <img src="../../../assets/images/student/recordings_tab.PNG" className="tab-image3" alt="Recordings Tab" />
                  </button>
                </div>
      
                <div id="Activity" className="tabcontent">
                  <div className="rightbox">
                    <div className="rb-container">
                      <ul className="rb">
                        <li className="rb-item">
                          <div className="timestamp">23rd July 2022<br />7:00 PM</div>
                          <div className="item-title">Solved 2 tactical puzzles</div>
                        </li>
                        <li className="rb-item">
                          <div className="timestamp">19th July 2022<br />3:00 PM</div>
                          <div className="item-title">Practiced 7 positions on <a href="/learnings">Piece Checkmates I</a></div>
                        </li>
                        <li className="rb-item">
                          <div className="timestamp">17st July 2022<br />7:00 PM</div>
                          <div className="item-title">Signed up to <a target="_blank" rel="noopener noreferrer" href="http://ystemandchess.com/">ystemandchess.com</a></div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
      
                <div id="Mentor_Session" className="tabcontent">
                  <h3>Mentor Session</h3>
                  <p>The project started in 2018 when someone needed something.</p>

                  <ChessWindow sid={'111'} mid={'222'} r={'mentor'} w={400}  h={400}/>
          
                </div>
      
                <div id="Professional_Development" className="tabcontent">
                  <h3>Professional Development</h3>
                </div>
      
                <div id="Chess_Lession" className="tabcontent">
                  <h3>Chess Lession</h3>
                </div>
      
                <div id="Games" className="tabcontent">
                  <h3>Games</h3>
                </div>
      
                <div id="Puzzles" className="tabcontent">
                  <h3>Puzzle</h3>
                </div>
      
                <div id="computer" className="tabcontent">
                  <h3>Computer</h3>
                </div>
      
                <div id="Recordings" className="tabcontent">
                  <h3>Recording</h3>
                  {recordingList.map((record, index) => (
                    <p key={index}>
                      <img src="https://cdn.iconscout.com/icon/free/png-256/play-circle-round-player-music-30547.png" srcSet="https://cdn.iconscout.com/icon/free/png-512/play-circle-round-player-music-30547.png 2x" alt="Play Icon" width="20" />&nbsp;
                      <strong>
                        <a style={{ color: '#007bff', cursor: 'pointer' }} title="Click to see the recording" target="_blank" rel="noopener noreferrer" onClick={() => getPresignURL(record.sid, record.meetingId)}>
                          {record.sid}_{record.meetingId}_0.mp4
                        </a>
                      </strong>&nbsp; - {record.meetingStartTime}
                    </p>
                  ))}
                </div>
              </div>
      
              {/* Repeat similar structure for Studentname2 and Studentname3 */}
              <div id="Studentname2" className="mainTabcontent">
                <div className="row mb-3">
                  <div className="col-7">
                    <div className="progressInfo">
                      <img src="../../../assets/images/mentor-profile/student-graph.PNG" alt="Student Graph" />
                    </div>
                  </div>
                  <div className="col-5">
                    <div className="memberInfo">
                      <h5 style={{ marginLeft: '-35px' }}><strong>Time Spent:</strong></h5>
                      <p className="time-icon"><span className="website-icon"></span>&nbsp; Website: <strong>60 minutes</strong></p>
                      <p className="time-icon"><span className="website-icon"></span>&nbsp; Lesson: <strong>13 minutes</strong></p>
                      <p className="time-icon"><span className="website-icon"></span>&nbsp; Puzzle: <strong>35 minutes</strong></p>
                      <p className="time-icon"><span className="website-icon"></span>&nbsp; Playing: <strong>15 minutes</strong></p>
                      <p className="time-icon"><span className="website-icon"></span>&nbsp; Mentoring: <strong>5 minutes</strong></p>
                      </div>
                  </div>
                </div>
                      <div className="tab">
                        <button className="stablinks tab1" onClick={(e) => openTab(e, 'Activity2', 'tabcontent1')} id="defaultOpen2">
                        <img src="../../../assets/images/student/activity_tab.png" className="tab-image" alt="Activity Tab" />
                        </button>
                        <button className="stablinks tab2" onClick={(e) => openTab(e, 'Mentor_Session2', 'tabcontent1')}>
                        <img src="../../../assets/images/student/mento_tab.PNG" className="tab-image2" alt="Mentor Session Tab" />
                        </button>
                        <button className="stablinks tab2" onClick={(e) => openTab(e, 'Professional_Development2', 'tabcontent1')}>
                        <img src="../../../assets/images/student/prodev_tab.PNG" className="tab-image2" alt="Professional Development Tab" />
                        </button>
                        <button className="stablinks tab2" onClick={(e) => openTab(e, 'Chess_Lession2', 'tabcontent1')}>
                        <img src="../../../assets/images/student/chess_tab.PNG" className="tab-image2" alt="Chess Lesson Tab" />
                        </button>
                        <button className="stablinks tab2" onClick={(e) => openTab(e, 'Games2', 'tabcontent1')}>
                        <img src="../../../assets/images/student/games_tab.PNG" className="tab-image2" alt="Games Tab" />
                        </button>
                        <button className="stablinks tab2" onClick={(e) => openTab(e, 'Puzzles2', 'tabcontent1')}>
                        <img src="../../../assets/images/student/puzzles_tab.PNG" className="tab-image2" alt="Puzzles Tab" />
                        </button>
                        <button className="stablinks tab2" onClick={(e) => openTab(e, 'computer2', 'tabcontent1')}>
                        <img src="../../../assets/images/student/play_tab.PNG" className="tab-image2" alt="Computer Tab" />
                        </button>
                        <button className="stablinks tab3" onClick={(e) => openTab(e, 'Recordings2', 'tabcontent1')}>
                        <img src="../../../assets/images/student/recordings_tab.PNG" className="tab-image3" alt="Recordings Tab" />
                        </button>
                    </div>

                    <div id="Activity2" className="tabcontent1">
                        <div className="rightbox">
                        <div className="rb-container">
                            <ul className="rb">
                            <li className="rb-item">
                                <div className="timestamp">23rd July 2022<br />7:00 PM</div>
                                <div className="item-title">Solved 2 tactical puzzles</div>
                            </li>
                            <li className="rb-item">
                                <div className="timestamp">19th July 2022<br />3:00 PM</div>
                                <div className="item-title">Practiced 7 positions on <a href="/learnings">Piece Checkmates I</a></div>
                            </li>
                            <li className="rb-item">
                                <div className="timestamp">17st July 2022<br />7:00 PM</div>
                                <div className="item-title">Signed up to <a target="_blank" rel="noopener noreferrer" href="http://ystemandchess.com/">ystemandchess.com</a></div>
                            </li>
                            </ul>
                        </div>
                        </div>
                    </div>

                    <div id="Mentor_Session2" className="tabcontent1">
                        <h3>Mentor Session</h3>
                        <p>The project started in 2018 when someone needed something.</p>
                    </div>

                    <div id="Professional_Development2" className="tabcontent1">
                        <h3>Professional Development</h3>
                    </div>

                    <div id="Chess_Lession2" className="tabcontent1">
                        <h3>Chess Lession</h3>
                    </div>

                    <div id="Games2" className="tabcontent1">
                        <h3>Games</h3>
                    </div>

                    <div id="Puzzles2" className="tabcontent1">
                        <h3>Puzzle</h3>
                    </div>

                    <div id="computer2" className="tabcontent1">
                        <h3>Computer</h3>
                    </div>

                    <div id="Recordings2" className="tabcontent1">
                        <h3>Recording</h3>
                        {recordingList.map((record, index) => (
                        <p key={index}>
                            <img src="https://cdn.iconscout.com/icon/free/png-256/play-circle-round-player-music-30547.png" srcSet="https://cdn.iconscout.com/icon/free/png-512/play-circle-round-player-music-30547.png 2x" alt="Play Icon" width="20" />&nbsp;
                            <strong>
                            <a style={{ color: '#007bff', cursor: 'pointer' }} title="Click to see the recording" target="_blank" rel="noopener noreferrer" onClick={() => getPresignURL(record.sid, record.meetingId)}>
                                {record.sid}_{record.meetingId}_0.mp4
                            </a>
                            </strong>&nbsp; - {record.meetingStartTime}
                        </p>
                        ))}
                    </div>
                    </div>

                    <div id="Studentname3" className="mainTabcontent">
                        <div className="row mb-3">
                            <div className="col-7">
                            <div className="progressInfo">
                                <img src="../../../assets/images/mentor-profile/student-graph.PNG" alt="Student Graph" />
                            </div>
                            </div>
                            <div className="col-5">
                            <div className="memberInfo">
                                <h5 style={{ marginLeft: '-35px' }}><strong>Time Spent:</strong></h5>
                                <p className="time-icon"><span className="website-icon"></span>&nbsp; Website: <strong>50 minutes</strong></p>
                                <p className="time-icon"><span className="website-icon"></span>&nbsp; Lesson: <strong>25 minutes</strong></p>
                                <p className="time-icon"><span className="website-icon"></span>&nbsp; Puzzle: <strong>30 minutes</strong></p>
                                <p className="time-icon"><span className="website-icon"></span>&nbsp; Playing: <strong>5 minutes</strong></p>
                                <p className="time-icon"><span className="website-icon"></span>&nbsp; Mentoring: <strong>20 minutes</strong></p>
                            </div>
                            </div>
                        </div>

                        <div className="tab">
                            <button className="tablinks tab1" onClick={(e) => openTab(e, 'Activity3', 'tabcontent2')} id="student3">
                            <img src="../../../assets/images/student/activity_tab.png" className="tab-image" alt="Activity Tab" />
                            </button>
                            <button className="tablinks tab2" onClick={(e) => openTab(e, 'Mentor_Session3', 'tabcontent2')}>
                            <img src="../../../assets/images/student/mento_tab.PNG" className="tab-image2" alt="Mentor Session Tab" />
                            </button>
                            <button className="tablinks tab2" onClick={(e) => openTab(e, 'Professional_Development3', 'tabcontent2')}>
                            <img src="../../../assets/images/student/prodev_tab.PNG" className="tab-image2" alt="Professional Development Tab" />
                            </button>
                            <button className="tablinks tab2" onClick={(e) => openTab(e, 'Chess_Lession3', 'tabcontent2')}>
                            <img src="../../../assets/images/student/chess_tab.PNG" className="tab-image2" alt="Chess Lesson Tab" />
                            </button>
                            <button className="tablinks tab2" onClick={(e) => openTab(e, 'Games3', 'tabcontent2')}>
                            <img src="../../../assets/images/student/games_tab.PNG" className="tab-image2" alt="Games Tab" />
                            </button>
                            <button className="tablinks tab2" onClick={(e) => openTab(e, 'Puzzles3', 'tabcontent2')}>
                            <img src="../../../assets/images/student/puzzles_tab.PNG" className="tab-image2" alt="Puzzles Tab" />
                            </button>
                            <button className="tablinks tab2" onClick={(e) => openTab(e, 'computer3', 'tabcontent2')}>
                            <img src="../../../assets/images/student/play_tab.PNG" className="tab-image2" alt="Computer Tab" />
                            </button>
                            <button className="tablinks tab3" onClick={(e) => openTab(e, 'Recordings3', 'tabcontent2')}>
                            <img src="../../../assets/images/student/recordings_tab.PNG" className="tab-image3" alt="Recordings Tab" />
                            </button>
                        </div>

                        <div id="Activity3" className="tabcontent2">
                        <div className="rightbox">
                                <div className="rb-container">
                                    <ul className="rb">
                                    <li className="rb-item">
                                        <div className="timestamp">23rd July 2022<br />7:00 PM</div>
                                        <div className="item-title">Solved 2 tactical puzzles</div>
                                    </li>
                                    <li className="rb-item">
                                        <div className="timestamp">19th July 2022<br />3:00 PM</div>
                                        <div className="item-title">Practiced 7 positions on <a href="/learnings">Piece Checkmates I</a></div>
                                    </li>
                                    <li className="rb-item">
                                        <div className="timestamp">17st July 2022<br />7:00 PM</div>
                                        <div className="item-title">Signed up to <a target="_blank" rel="noopener noreferrer" href="http://ystemandchess.com/">ystemandchess.com</a></div>
                                    </li>
                                    </ul>
                                </div>
                                </div>
                            </div>

                                <div id="Mentor_Session3" className="tabcontent2">
                            <h3>Mentor Session</h3>
                            <p>The project started in 2018 when someone needed something.</p>
                        </div>

                        <div id="Professional_Development3" className="tabcontent2">
                            <h3>Professional Development</h3>
                        </div>

                        <div id="Chess_Lession3" className="tabcontent2">
                            <h3>Chess Lession</h3>
                        </div>

                        <div id="Games3" className="tabcontent2">
                            <h3>Games</h3>
                        </div>

                        <div id="Puzzles3" className="tabcontent2">
                            <h3>Puzzle</h3>
                        </div>

                        <div id="computer3" className="tabcontent2">
                            <h3>Computer</h3>
                        </div>

                        <div id="Recordings3" className="tabcontent2">
                            <h3>Recording</h3>
                            {recordingList.map((record, index) => (
                            <p key={index}>
                                <img src="https://cdn.iconscout.com/icon/free/png-256/play-circle-round-player-music-30547.png" srcSet="https://cdn.iconscout.com/icon/free/png-512/play-circle-round-player-music-30547.png 2x" alt="Play Icon" width="20" />&nbsp;
                                <strong>
                                <a style={{ color: '#007bff', cursor: 'pointer' }} title="Click to see the recording" target="_blank" rel="noopener noreferrer" onClick={() => getPresignURL(record.sid, record.meetingId)}>
                                    {record.sid}_{record.meetingId}_0.mp4
                                </a>
                                </strong>&nbsp; - {record.meetingStartTime}
                            </p>
                            ))}
                        </div>
                        </div>
                    </div>

                    <div className="row" style={{ height: '500px' }}>
                        <div id="pdf-div" className="pdf-view"></div>
                    </div>
                    </div>

                    <footer style={{ marginTop: '16%' }}>
                    <app-footer></app-footer>
                    </footer>
        </div>
)};
export default MentorProfile;