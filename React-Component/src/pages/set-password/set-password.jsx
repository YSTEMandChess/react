import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import './SetPassword.css';

const SetPassword = () => {
  const [token, setToken] = useState(null);
  const [confirmError, setConfirmError] = useState('');
  const [showData, setShowData] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setToken(params.get('token'));
  }, [location]);

  const checkConfirmPassword = () => {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('cpassword').value;

    if (password === confirmPassword) {
      setConfirmError('');
      verifyInDataBase(password);
      return true;
    } else {
      setConfirmError('Password and confirm password do not match');
      return false;
    }
  };

  const verifyInDataBase = async (password) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_MIDDLEWARE_URL}/user/resetPassword`,
        {},
        {
          params: {
            password,
            token,
          },
          headers: {
            Authorization: `Bearer ${document.cookie.split('login=')[1]}`,
          },
        }
      );

      if (response.status === 200) {
        setShowData(true);
      } else {
        setShowData(false);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  return (
    <div className="input-container">
      {!showData ? (
        <>
          <h4>Enter Your New Password</h4>
          <li>
            <input type="password" placeholder="New Password" id="password" />
          </li>
          <li>
            <input
              type="password"
              placeholder="Confirm New Password"
              id="cpassword"
            />
          </li>
          <h6>{confirmError}</h6>
          <button type="submit" onClick={checkConfirmPassword}>
            Enter
          </button>
        </>
      ) : (
        <>
          <h4>Password Changed Successfully 🎉</h4>
          <Link to="/login">Login</Link>
        </>
      )}
    </div>
  );
};

export default SetPassword;
