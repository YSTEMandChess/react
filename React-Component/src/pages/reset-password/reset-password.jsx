import React, { useState } from 'react';
import Cookies from 'js-cookie';
import './reset-password.component.scss';
import { environment } from '../../environments/environment.js';

const ResetPassword = () => {
  const [link, setLink] = useState('/');
  const [usernameFlag, setUsernameFlag] = useState(false);
  const [emailFlag, setEmailFlag] = useState(false);
  const [userNameError, setUserNameError] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [result, setResult] = useState(null);
  const [showData, setShowData] = useState(false);

  const usernameVerification = () => {
    const username = document.getElementById('username').value;
    if (username.length > 2) {
      setUsernameFlag(true);
      setUserNameError('');
    } else {
      setUsernameFlag(false);
      setUserNameError('Invalid username');
    }
  };

  const emailVerification = (event) => {
    const email = event.target.value;
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/.test(email)) {
      setEmailFlag(true);
      setEmailError('');
      return true;
    } else {
      setEmailFlag(false);
      setEmailError('Invalid Email');
      return false;
    }
  };

  const errorMessages = () => {
    if (!emailFlag || !usernameFlag) {
      setResetPasswordError('Invalid username or email');
    } else {
      setResetPasswordError('');
    }
  };

  const verifyUser = () => {
    if (usernameFlag && emailFlag) {
      verifyInDataBase();
    } else {
      setLink('/resetpassword');
    }
  };

  const verifyInDataBase = () => {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;

    const baseURL = environment.urls.middlewareURL;
    if (!baseURL) {
      console.error('Middleware URL is not defined');
      return;
    }

    httpGetAsync(
      `${baseURL}/user/sendMail?username=${username}&email=${email}`,
      'POST',
      (response) => {
        if (response.status === 200) {
          setResult('');
          setShowData(true);
        } else {
          setResult('Invalid data');
          setShowData(false);
        }
      }
    );
  };

  const httpGetAsync = (theUrl, method = 'POST', callback) => {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        callback(xmlHttp);
      }
    };
    xmlHttp.open(method, theUrl, true); // true for asynchronous
    xmlHttp.setRequestHeader('Authorization', `Bearer ${Cookies.get('login')}`);
    xmlHttp.send(null);
  };

  return (
    <div>
      <header>
        <link
          href="https://fonts.googleapis.com/css?family=Roboto"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Lato"
          rel="stylesheet"
        />
      </header>
      <div className="input-container">
        {!showData ? (
          <>
            <h4>Please Enter UserName and Email To Reset Your Password</h4>
            <li>
              <input
                type="text"
                placeholder="UserName"
                id="username"
                onBlur={usernameVerification}
              />
              <h6>{userNameError}</h6>
            </li>
            <li>
              <input
                type="email"
                placeholder="Email"
                id="email"
                onBlur={emailVerification}
              />
              <h6>{emailError}</h6>
              <h3>{result}</h3>
            </li>
            <button onClick={() => { errorMessages(); verifyUser(); }}>
              Enter
            </button>
          </>
        ) : (
          <div>
            <p>
              A password reset link was sent to your registered email. Click the link
              in the email to create a new password.
            </p>
            <div>
              If you have already changed the password then click the
              <a href="/login">Login</a>
            </div>
          </div>
        )}
      </div>
      <footer></footer>
    </div>
  );
};

export default ResetPassword;
