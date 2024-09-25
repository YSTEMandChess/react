import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './set-password.component.scss';

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [showData, setShowData] = useState(false);
  const [token, setToken] = useState('');

  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token');
    setToken(tokenFromUrl);
  }, [location]);

  const checkConfirmPassword = () => {
    if (password === confirmPassword) {
      setConfirmError('');
      submitNewPassword();
      return true;
    } else {
      setConfirmError('Password and confirm password do not match');
      return false;
    }
  };

  const submitNewPassword = () => {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    fetch(`${baseURL}/user/resetPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: password,
        token: token,
      }),
    })
      .then((response) => {
        if (response.ok) {
          setShowData(true);
        } else {
          return response.json().then((data) => {
            setConfirmError(data.message || 'Error resetting password');
          });
        }
      })
      .catch((error) => {
        setConfirmError('An error occurred. Please try again.');
        console.error('Error:', error);
      });
  };

  return (
    <div>
      <header>
        <link
          href='https://fonts.googleapis.com/css?family=Roboto'
          rel='stylesheet'
        />
        <link
          href='https://fonts.googleapis.com/css?family=Lato'
          rel='stylesheet'
        />
      </header>

      <div className='input-container'>
        {!showData ? (
          <>
            <h4>Enter Your New Password</h4>
            <li>
              <input
                type='password'
                placeholder='New Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </li>
            <li>
              <input
                type='password'
                placeholder='Confirm New Password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <h6>{confirmError}</h6>
            </li>
            <button onClick={checkConfirmPassword}>Enter</button>
          </>
        ) : (
          <div>
            <h4>Password Changed Successfully 🎉</h4>
            <a href='/login'>Login</a>
          </div>
        )}
      </div>

      <footer></footer>
    </div>
  );
};

export default SetPassword;
