import React, { useState } from 'react';
import { useNavigate } from 'react-router';

const ResetPassword = () => {
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${baseURL}/user/sendMail?username=${encodeURIComponent(formData.username)}&email=${encodeURIComponent(formData.email)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );

      const data = await response.json();
      if (response.ok && data.token) {
        navigate(`/set-password?token=${data.token}`);
      } else {
        setError(data.message || 'Error requesting password reset');
      }
    } catch {
      setError('Error connecting to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto p-6' role="main">
      <h2 className='text-2xl font-bold mb-6'>Reset Password</h2>

      {error && (
        <div
          className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleResetRequest} className='space-y-4'>
        {[
          { label: 'Username', name: 'username', type: 'text', placeholder: 'UserName' },
          { label: 'Email', name: 'email', type: 'email', placeholder: 'Email' }
        ].map(({ label, name, type, placeholder }) => (
          <div key={name}>
            <label htmlFor={name} className='block text-sm font-medium mb-1'>{label}</label>
            <input
              id={name}
              name={name}
              type={type}
              placeholder={placeholder}
              value={(formData as any)[name]}
              onChange={handleChange}
              className='w-full p-2 border rounded'
              required
              disabled={isLoading}
            />
          </div>
        ))}

        <button
          type='submit'
          disabled={isLoading}
          data-testid="reset-submit"
          className={`w-full bg-blue-500 text-white p-2 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
          aria-busy={isLoading}
        >
          {isLoading ? 'Sending...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
