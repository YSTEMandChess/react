import React from 'react';
import { Link } from 'react-router-dom';
import './Login.scss';
import { useState } from 'react';
import { environment } from '../../environments/environment';
import { useCookies } from 'react-cookie';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cookies, setCookie] = useCookies(['login']);
  const [loginError, setLoginError] = useState('');
  const [usernameFlag, setUsernameFlag] = useState(false);
  const [passwordFlag, setPasswordFlag] = useState(false);

  const usernameVerification = () => {
    if (username.length > 2) {
      setUsernameFlag(true);
    } else {
      setUsernameFlag(false);
    }
  };

  const passwordVerification = () => {
    if (password.length < 8) {
      setPasswordFlag(false);
    } else {
      setPasswordFlag(true);
    }
  };

  const errorMessages = () => {
    if (passwordFlag === false || usernameFlag === false) {
      setLoginError('Invalid username or password');
    } else {
      setLoginError('');
    }
  };

  const submitLogin = (e: any) => {
    e.preventDefault();
    errorMessages();

    let url = `${environment.urls.middlewareURL}/auth/login?username=${username}&password=${password}`;

    const httpGetAsync = (theUrl: string, callback: any) => {
      let xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
          callback(xmlHttp.responseText);
      };
      xmlHttp.open('POST', theUrl, true);
      xmlHttp.send(null);
    };

    httpGetAsync(url, (response: any) => {
      if (response === 'The username or password is incorrect.') {
        setLoginError('The username or password is incorrect.');
      } else {
        const expires = new Date();
        expires.setDate(expires.getDate() + 1);
        setCookie('login', JSON.parse(response).token, { expires });

        let payload = JSON.parse(atob(response.split('.')[1]));
        console.log(payload, true);

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
    });
  };

  return (
    <>
      <h1 id='login-h1'>Login</h1>
      {loginError && <h3 id='loginError-h3'>{loginError}</h3>}

      <form className='login-input-container' onSubmit={submitLogin}>
        <div className='login-input-field'>
          <input
            type='text'
            name='username'
            id='username'
            placeholder='Username'
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              usernameVerification();
            }}
            required
          />
        </div>
        <div className='login-input-field'>
          <input
            type='password'
            name='password'
            placeholder='Password'
            id='password'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              passwordVerification();
            }}
            required
          />
        </div>
        <button id='button-login' type='submit'>
          Enter
        </button>
      </form>

      <div className='additional-options'>
        <Link to='/signup' className='option'>
          Create a new account
        </Link>
        <Link to='/reset-password' className='option'>
          Forgot password?
        </Link>
      </div>
    </>
  );
};

export default Login;
