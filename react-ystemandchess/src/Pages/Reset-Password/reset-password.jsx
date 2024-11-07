import React, { useState } from 'react';
import { useCookies } from 'react-cookie';
import './reset-password.component.scss';
import { environment } from '../../environments/environment.js';

const ResetPassword = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userNameError, setUserNameError] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [result, setResult] = useState(null);
  const [showData, setShowData] = useState(false);
  const [cookies] = useCookies(['login']);

  const usernameVerification = () => {
    if (username.length > 2) {
      setUserNameError('');
      return true;
    } else {
      setUserNameError('Invalid username');
      return false;
    }
  };

  const emailVerification = () => {
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/.test(email)) {
      setEmailError('');
      return true;
    } else {
      setEmailError('Invalid Email');
      return false;
    }
  };

  const errorMessages = () => {
    const isUsernameValid = usernameVerification();
    const isEmailValid = emailVerification();
    if (!isUsernameValid || !isEmailValid) {
      setResetPasswordError('Invalid username or email');
      return false;
    } else {
      setResetPasswordError('');
      return true;
    }
  };

  const verifyUser = () => {
    if (errorMessages()) {
      verifyInDataBase();
    }
  };

  const verifyInDataBase = () => {
    const baseURL = environment.urls.middlewareURL;
    if (!baseURL) {
      console.error('Middleware URL is not defined');
      return;
    }

    const data = { username, email };
    console.log('Sending data:', data);

    fetch(`${baseURL}/user/sendMail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cookies.login}`
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          return response.json().then(err => { throw new Error(err.message) });
        }
        return response.json();
      })
      .then(data => {
        console.log('Response data:', data);
        if (data.message === 'Mail Sent') {
          setResult('');
          setShowData(true);
        } else {
          setResult(data.message || 'Invalid data');
          setShowData(false);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        setResult(error.message || 'Invalid data');
        setShowData(false);
      });
  };

  return (
    <div>
      
      <div className="input-container-rp">
        {!showData ? (
          <>
            <h4>Please Enter UserName and Email To Reset Your Password</h4>
            <li>
              <input
                id="username-rp"
                type="text"
                placeholder="UserName"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onBlur={usernameVerification}
              />
              <h6 id="err-reset">{userNameError}</h6>
            </li>
            <li>
              <input
                id="email-rp"
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={emailVerification}
              />
              <h6 id="err-reset">{emailError}</h6>
              <h3 id="h3-reset">{result}</h3>
            </li>
            <button id="button-rp" onClick={verifyUser}>Enter</button>
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
     
    </div>
  );
};

export default ResetPassword;