import React, { useState } from 'react';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import axios from 'axios';

const Login = () => {
  const [cookies, setCookie] = useCookies(['login']);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const usernameVerification = () => {
    return username.length > 2;
  };

  const passwordVerification = () => {
    return password.length >= 8;
  };

  const verifyUser = () => {
    if (usernameVerification() && passwordVerification()) {
      verifyInDatabase();
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const verifyInDatabase = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_MIDDLEWARE_URL}/auth/login`, null, {
        params: { username, password },
      });

      const token = response.data.token;
      setCookie('login', token, { path: '/', maxAge: 86400 });

      const payload = JSON.parse(atob(token.split('.')[1]));

      switch (payload.role) {
        case 'student':
          navigate('/student');
          break;
        case 'parent':
          navigate('/parent');
          break;
        case 'mentor':
          navigate('/mentor-profile');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      setLoginError('Username or Password is incorrect');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <h3>{loginError}</h3>
      <div className="input-container">
        <input
          type="text"
          placeholder="username"
          id="username"
          value={username}
          onBlur={usernameVerification}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="password"
          id="password"
          value={password}
          onBlur={passwordVerification}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" onClick={verifyUser}>
          Enter
        </button>
        <div className="links">
          <a href="/signup">Create new account</a>
          <a href="/resetpassword">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
