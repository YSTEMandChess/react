import React from 'react';
import './Login.scss';
import { useState } from 'react';
import { environment } from '../../environments/environment';
import { useCookies } from 'react-cookie';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cookies, setCookie] = useCookies(['login']);
  const [loginError, setLoginError] = useState('');

  const submitLogin = (e) => {
    e.preventDefault();
    if (password.length < 8 || username.length <= 2) {
      setLoginError('Invalid username or password');
      return;
    } else {
      setLoginError('');
    }

    let url = `${environment.urls.middlewareURL}/auth/login?username=${username}&password=${password}`;

    const httpGetAsync = (theUrl, callback, onError) => {
      let xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4) {
          if (xmlHttp.status >= 200 && xmlHttp.status < 300) {
            callback(xmlHttp.responseText);
          } else {
            if (onError) {
              onError();
            }
          }
        }
      };
      xmlHttp.open('POST', theUrl, true);
      xmlHttp.send(null);
    };

    httpGetAsync(
      url,
      (response) => {
        if (response === 'The username or password is incorrect.') {
          setLoginError('The username or password is incorrect.');
        } else {
          const expires = new Date();
          expires.setDate(expires.getDate() + 1);
          setCookie('login', JSON.parse(response).token, { expires });

          let payload = JSON.parse(atob(response.split('.')[1]));

          switch (payload['role']) {
            case 'student':
              window.location.pathname = '/student-profile';
              break;
            case 'parent':
              window.location.pathname = '/parent';
              break;
            case 'mentor':
              window.location.pathname = '/mentor-profile';
              break;
            case 'admin':
              window.location.pathname = '/admin';
              break;
            default:
              window.location.pathname = '';
          }
        }
      },
      () => {
        setLoginError('The username or password is incorrect.');
      }
    );
  };

  return (
    <div className="login-page">
      <h1 className="login-title">Welcome Back!</h1>
      {loginError && <p className="login-error">{loginError}</p>}

      <form className="login-form" onSubmit={submitLogin}>
        <div className="input-wrapper">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-wrapper">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="button-wrapper">
          <button type="submit">Login</button>
        </div>
      </form>

      <div className="login-links">
        <a href="/signup">Create Account</a>
        <a href="/reset-password">Forgot Password?</a>
      </div>
    </div>
  );
};

export default Login;
