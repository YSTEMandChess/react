import React from 'react';
// import { Link } from 'react-router-dom';
import './Login.scss';
import { useState } from 'react';
import { environment } from "../../../environments/environment";
import { useCookies } from 'react-cookie';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cookies, setCookie] = useCookies(['login']);
  const [loginError, setLoginError] = useState('');
  const [usernameFlag, setUsernameFlag] = useState(false);
  const [passwordFlag, setPasswordFlag] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const usernameVerification = () => {
    if (username.length > 2) {
      setUsernameFlag(false);
    } else {
      setUsernameFlag(true);
    }
  };

  const passwordVerification = () => {
    if (password.length < 8) {
      setPasswordFlag(true);
    } else {
      console.log('verifying pw')
      setPasswordFlag(false);
    }
  };

  const errorMessages = () => {
    if (passwordFlag === true || usernameFlag === true) {
      setLoginError('Invalid username or password');
    } else {
      setLoginError('');
    }
  };

  const submitLogin = (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    // errorMessages();
    if (password.length < 8 || username.length <= 2) {
      setUsernameFlag(true);
      setPasswordFlag(true);
      setLoginError('Invalid username or password');
      return;
    } else {
      setLoginError('');
    }

    let url = `${environment.urls.middlewareURL}/auth/login?username=${username}&password=${password}`;

    const httpGetAsync = (theUrl: string, callback: any, onError: any) => {
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

    httpGetAsync(url, (response: any) => {
      if (response === 'The username or password is incorrect.') {
        setLoginError('The username or password is incorrect.');
        setIsLoading(false);
      } else {
        const expires = new Date();
        expires.setDate(expires.getDate() + 1);
        setCookie('login', JSON.parse(response).token, { expires });

        let payload = JSON.parse(atob(response.split('.')[1]));
        console.log(payload)

        switch (payload['role']) {
          case 'student':
            window.location.pathname = '/student-profile';
            console.log(payload['role'])
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
      setIsLoading(false);
    }, () => {
      setLoginError('The username or password is incorrect.');
      setIsLoading(false);
    });
  };

  return (
    <div className='login-page'>
      <h1 className='login-title'>Login</h1>
      {loginError && <div className='login-error' role="alert">{loginError}</div>}

      <form className='login-form' aria-label="Login Form" aria-busy={isLoading} onSubmit={submitLogin}>
        <div className='input-wrapper'>
          <label htmlFor='username' id="username-label">Username</label>
          <input
            type='text'
            name='username'
            id='username'
            placeholder='Username'
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              //usernameVerification();
            }}
            aria-describedby='loginError-h3'
            aria-invalid={usernameFlag}
            required
          />
        </div>
        <div className='input-wrapper'>
          <label htmlFor='password' id="password-label">Password</label>
          <input
            type='password'
            name='password'
            placeholder='Password'
            id='password'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              //passwordVerification();
            }}
            aria-describedby='loginError-h3'
            aria-invalid={passwordFlag}
            required
          />
        </div>
        <div className='button-wrapper'>
          <button type='submit' aria-label='Login Button' disabled={isLoading}>
          Enter
        </button>
        </div>
      </form>

      <nav className='login-links' aria-label="Account Options">
        <a href='/signup'>
          Create a new account
        </a>
        <a href='/reset-password'>
          Forgot password?
        </a>
      </nav>
    </div>
  );
};

export default Login;
