import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${baseURL}/user/sendMail?username=${encodeURIComponent(
          username
        )}&email=${encodeURIComponent(email)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.token) {
        navigate(`/set-password?token=${data.token}`);
      } else {
        setError(data.message || 'Error requesting password reset');
      }
    } catch (error) {
      console.error('Reset request error:', error);
      setError('Error connecting to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto p-6'>
      <h2 className='text-2xl font-bold mb-6'>Reset Password</h2>

      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      <form onSubmit={handleResetRequest} className='space-y-4'>
        <div>
          <label htmlFor='username' className='block text-sm font-medium mb-1'>
            Username
          </label>
          <input
            id='username'
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className='w-full p-2 border rounded'
            required
            disabled={isLoading}
          />
        </div>


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
