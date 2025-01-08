import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

        <div>
          <label htmlFor='email' className='block text-sm font-medium mb-1'>
            Email
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {isLoading ? 'Sending...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
