import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseURL}/user/setPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          token,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to update password');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className='max-w-md mx-auto p-6'>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          Invalid reset link. Please request a new password reset.
          <button
            onClick={() => navigate('/reset-password')}
            className='block mt-2 text-blue-500 hover:underline'
          >
            Go to Reset Password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto p-6'>
      <h2 className='text-2xl font-bold mb-6'>Set New Password</h2>

      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label htmlFor='password' className='block text-sm font-medium mb-1'>
            New Password
          </label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full p-2 border rounded'
            required
            disabled={isLoading}
            minLength={8}
          />
        </div>

        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-medium mb-1'
          >
            Confirm Password
          </label>
          <input
            id='confirmPassword'
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className='w-full p-2 border rounded'
            required
            disabled={isLoading}
          />
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className={`w-full bg-blue-500 text-white p-2 rounded ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Updating...' : 'Set New Password'}
        </button>
      </form>
    </div>
  );
};

export default SetPassword;
