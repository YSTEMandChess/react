import React, { useEffect, useState } from 'react';
import { SetPermissionLevel } from '../../globals.js'; 
import { useCookies } from 'react-cookie';
import { environment } from '../../environments/environment.js';
import './UserProfile.scss';

const UserProfile = () => {
  const [cookies] = useCookies(['login']);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountCreatedAt, setAccountCreatedAt] = useState('');
  const [role, setRole] = useState('');
  const [recordingList, setRecordingList] = useState([]);
  const [sharedPdfList, setSharedPdfList] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [showPdfListView, setShowPdfListView] = useState(false);
  const [signedURL, setSignedURL] = useState('');
  const [playLink, setPlayLink] = useState('play-nolog');

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

  const openTab = (evt, tabName) => {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName('tabcontent');
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = 'none';
    }
    tablinks = document.getElementsByClassName('tablinks');
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(' active', '');
    }
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.className += ' active';
  };

  const showSharedSlideShowPdfList = (catId, catName) => {
    setShowPdfListView(true);
    setCategoryName(catName);
    let pdfList = [];
    switch (catId) {
      case '1':
        pdfList = [
          { id: '1', FileName: 'Mantra 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '2', FileName: 'Mantra 2', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '3', FileName: 'Mantra 3', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '4', FileName: 'Mantra 4', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '5', FileName: 'Mantra 5', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '6', FileName: 'Mantra 6', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
        ];
        break;
      case '2':
        pdfList = [
          { id: '1', FileName: 'Exercise 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '2', FileName: 'Exercise 2', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '3', FileName: 'Exercise 3', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '4', FileName: 'Exercise 4', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '5', FileName: 'Exercise 5', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
        ];
        break;
      case '3':
        pdfList = [
          { id: '1', FileName: 'One Personal Development Lesson 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '2', FileName: 'One Personal Development Lesson 2', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '3', FileName: 'One Personal Development Lesson 3', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '4', FileName: 'One Personal Development Lesson 4', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
        ];
        break;
      case '4':
        pdfList = [
          { id: '1', FileName: 'Chess Lesson 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '2', FileName: 'Chess Lesson 2', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '3', FileName: 'Chess Lesson 3', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
        ];
        break;
      case '5':
        pdfList = [
          { id: '1', FileName: 'Game 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
          { id: '2', FileName: 'Game 2', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
        ];
        break;
      case '6':
        pdfList = [
          { id: '1', FileName: 'Puzzles 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
        ];
        break;
      default:
        pdfList = [
          { id: '1', FileName: 'demo 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
        ];
    }
    setSharedPdfList(pdfList);
  };

  const showSharedSlideShow = (filePath) => {
    if (!window.AdobeDC) {
      console.error("AdobeDC is not defined");
      return;
    }
    
    const adobeDCView = new window.AdobeDC.View({ clientId: "YOUR_CLIENT_ID" });
    adobeDCView.previewFile({
      content: { location: { url: filePath } },
      metaData: { fileName: filePath.split('/').pop() }
    }, {
      embedMode: "SIZED_CONTAINER"
    });
  };

  const getPresignURL = async (sid, meetingId) => {
    const filename = `${sid}_${meetingId}_0.mp4`;
    console.log(filename);
    const url = `${process.env.REACT_APP_MIDDLEWARE_URL}/meetings/singleRecording?filename=${filename}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${document.cookie}`, // Adjust the way you retrieve the token
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSignedURL(data);
        if (data) {
          window.open(data);
        }
      } else {
        console.error('Failed to fetch pre-signed URL');
      }
    } catch (error) {
      console.error('Error fetching pre-signed URL:', error);
    }
};


return (
    <div className="userProfileDiv">
      <header>
        <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css" rel="stylesheet" />
      </header>
      <div className="container">
        <div className="myDiv">
          <h2>{firstName} {lastName}</h2>
        </div>
      </div>
  
      <div className="container">
        <div className="row">
          <div className="col-12">
            <img src="../../../assets/images/student/chart.PNG" alt="Chart" />
          </div>
        </div>
        <div className="col-12">
          <p style={{ fontSize: '24px', marginBottom: '2px' }}><strong>Time Spent :</strong></p>
          <div className="row" style={{ marginBottom: '20px' }}>
            <div className="col-4">
              <p style={{ marginLeft: '20px' }}> <span className="website-icon"></span>&nbsp; Website: <strong>45 minutes</strong></p>
            </div>
            <div className="col-4">
              <p style={{ marginLeft: '20px' }}><span className="lesson"></span>&nbsp; Lesson: <strong>10 minutes</strong></p>
            </div>
            <div className="col-4">
              <p style={{ marginLeft: '20px' }}><span className="puzzle"></span> &nbsp; Puzzle: <strong>5 minutes</strong></p>
            </div>
            <div className="col-4">
              <p style={{ marginLeft: '20px' }}><span className="playing"></span>&nbsp; Playing: <strong>15 minutes</strong></p>
            </div>
            <div className="col-4">
              <p style={{ marginLeft: '20px' }}><span className="mentoring"></span>&nbsp; Mentoring: <strong>15 minutes</strong></p>
            </div>
          </div>
        </div>
  
        <div className="tab">
          <button className="tablinks tab1" onClick={(e) => openTab(e, 'Activity')} id="defaultOpen">
            <img src="../../../assets/images/student/activity_tab.png" className="tab-image" alt="Activity Tab" />
          </button>
          <button className="tablinks tab2" onClick={(e) => openTab(e, 'Mentor_Session')}>
            <img src="../../../assets/images/student/mento_tab.PNG" className="tab-image2" alt="Mentor Session Tab" />
          </button>
          <button className="tablinks tab2" onClick={(e) => openTab(e, 'Professional_Development')}>
            <img src="../../../assets/images/student/prodev_tab.PNG" className="tab-image2" alt="Professional Development Tab" />
          </button>
          <button className="tablinks tab2" onClick={(e) => openTab(e, 'Chess_Lession')}>
            <img src="../../../assets/images/student/chess_tab.PNG" className="tab-image2" alt="Chess Lesson Tab" />
          </button>
          <button className="tablinks tab2" onClick={(e) => openTab(e, 'Games')}>
            <img src="../../../assets/images/student/games_tab.PNG" className="tab-image2" alt="Games Tab" />
          </button>
          <button className="tablinks tab2" onClick={(e) => openTab(e, 'Puzzles')}>
            <img src="../../../assets/images/student/puzzles_tab.PNG" className="tab-image2" alt="Puzzles Tab" />
          </button>
          <button className="tablinks tab2" onClick={(e) => openTab(e, 'computer')}>
            <img src="../../../assets/images/student/play_tab.PNG" className="tab-image2" alt="Computer Tab" />
          </button>
          <button className="tablinks tab3" onClick={(e) => openTab(e, 'Recordings')}>
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
          <iframe
            src="/chess-client/parent.html" // URL of chess parent container
            title="My Iframe"
            width="600"
            height="400"
            frameBorder="0"
            allowFullScreen
          ></iframe>

          <iframe
            src="/VideoConferencing/student-parent.html" // URL of chess parent container
            title="VideoConferencing"
            width="600"
            height="400"
            frameBorder="0"
            allowFullScreen
          ></iframe>

<iframe id="mentI" src="mentor-parent.html"></iframe>
<iframe id="studI" src="student-parent.html"></iframe>


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
          <h3>Puzzles</h3>
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
  
      <div className="row" style={{ height: '500px' }}>
        <div id="pdf-div" className="pdf-view"></div>
      </div>
  
      <footer style={{ marginTop: '16%' }}>
        <app-footer></app-footer>
      </footer>
    </div>
  )};
  
  export default UserProfile;