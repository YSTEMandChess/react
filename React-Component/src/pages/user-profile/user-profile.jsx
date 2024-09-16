import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import ViewSDKClient from '../../view-sdk.service';

const UserProfile = () => {
  const [recordingList, setRecordingList] = useState([]);
  const [sharedPdfList, setSharedPdfList] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [showPdfListView, setShowPdfListView] = useState(false);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountCreatedAt, setAccountCreatedAt] = useState('');
  const [role, setRole] = useState('');
  const [playLink, setPlayLink] = useState('play-nolog');
  const [signedURL, setSignedURL] = useState('');

  useEffect(() => {
    const init = async () => {
      let uInfo = await setPermissionLevel(Cookies);

      setUsername(uInfo.username);
      setFirstName(uInfo.firstName);
      setLastName(uInfo.lastName);
      setAccountCreatedAt(uInfo.accountCreatedAt);
      setRole(uInfo.role);

      if (uInfo.role === 'student') {
        setPlayLink('student');
      } else if (uInfo.role === 'mentor') {
        setPlayLink('play-mentor');
      }

      if (uInfo.role === 'student' || uInfo.role === 'mentor') {
        fetchRecordings();
      }
    };
    init();
  }, []);

  const fetchRecordings = () => {
    const url = `${process.env.REACT_APP_MIDDLEWARE_URL}/meetings/usersRecordings`;
    httpGetAsync(url, 'GET', (response) => {
      setRecordingList(JSON.parse(response));
    });
  };

  const httpGetAsync = (theUrl, method, callback) => {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
        callback(xmlHttp.responseText);
    };
    xmlHttp.open(method, theUrl, true);
    xmlHttp.setRequestHeader('Authorization', `Bearer ${Cookies.get('login')}`);
    xmlHttp.send(null);
  };

  const getPresignURL = (sid, meetingId) => {
    const filename = `${sid}_${meetingId}_0.mp4`;
    const url = `${process.env.REACT_APP_MIDDLEWARE_URL}/meetings/singleRecording?filename=${filename}`;
    httpGetAsync(url, 'GET', (response) => {
      setSignedURL(JSON.parse(response));
      if (signedURL) window.open(signedURL);
    });
  };

  const openTab = (evt, cityName) => {
    const tabcontent = document.getElementsByClassName('tabcontent');
    for (let i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = 'none';
    }

    const tablinks = document.getElementsByClassName('tablinks');
    for (let i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(' active', '');
    }

    document.getElementById(cityName).style.display = 'block';
    evt.currentTarget.className += ' active';
  };

  const showSharedSlideShowPdfList = (catId, catName) => {
    setShowPdfListView(true);
    setCategoryName(catName);

    const pdfList = {
      1: [
        { id: '1', FileName: 'Mantra 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
        // Other files...
      ],
      2: [
        { id: '1', FileName: 'Exercise 1', FilePath: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf' },
        // Other files...
      ],
      // Add cases for other categories
    };

    setSharedPdfList(pdfList[catId] || []);
  };

  const showSharedSlideShow = (filePath) => {
    ViewSDKClient.ready().then(() => {
      ViewSDKClient.previewFile(filePath, 'pdf-div', {
        embedMode: 'SIZED_CONTAINER',
        dockPageControls: false,
      });
    });
  };

  return (
    <div className="userProfileDiv">
      <div className="container">
        <div className="myDiv">
          <h2>{firstName} {lastName}</h2>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-12">
            <img src="/assets/images/student/chart.PNG" alt="Progress Chart" />
          </div>
        </div>
        <div className="col-12">
          <p style={{ fontSize: '24px', marginBottom: '2px' }}><strong>Time Spent :</strong></p>
          <div className="row" style={{ marginBottom: '20px' }}>
            <div className="col-4">
              <p style={{ marginLeft: '20px' }}> <span className="website-icon"></span>&nbsp; Website : <strong>45 minutes</strong></p>
            </div>
            {/* Add other time spent sections similarly */}
          </div>
        </div>
      </div>

      <div className="tab">
        <button className="tablinks" onClick={(e) => openTab(e, 'Activity')} id="defaultOpen">
          <img src="/assets/images/student/activity_tab.png" className="tab-image" alt="Activity Tab" />
        </button>
        {/* Add other tabs similarly */}
      </div>

      <div id="Activity" className="tabcontent">
        <div className="rightbox">
          <div className="rb-container">
            <ul className="rb">
              <li className="rb-item">
                <div className="timestamp">23rd July 2022<br /> 7:00 PM</div>
                <div className="item-title">Solved 2 tactical puzzles</div>
              </li>
              {/* Add other activity items similarly */}
            </ul>
          </div>
        </div>
      </div>

      {/* Add content for other tabs similarly */}

      <div id="pdf-div" className="pdf-view"></div>
    </div>
  );
};

export default UserProfile;
