import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import './reset-password.component.scss';

const ResetPassword = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleResetRequest = async (e: any) => {
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
      setError('Error connecting to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <h1 className="reset-title">Reset Password</h1>

      {error && (
        <div className="reset-error" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      <form onSubmit={handleResetRequest} className="reset-form">
        <div className="input-wrapper">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            placeholder="Enter your username"
            onChange={(e) => setUsername(e.target.value)}
            className="reset-input"
            required
            disabled={isLoading}
          />
        </div>

        <div className="input-wrapper">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="reset-input"
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="reset-button"
          data-testid="reset-submit"
          aria-busy={isLoading}
        >
          {isLoading ? 'Sending...' : 'Reset Password'}
        </button>
      </form>

      <div className="reset-links">
        <a href="/login">Back to Login</a>
      </div>
    </div>
  );
};

export default ResetPassword;
