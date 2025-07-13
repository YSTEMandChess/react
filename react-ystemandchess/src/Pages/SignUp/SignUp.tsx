import React, { useState } from 'react';
import './SignUp.scss';
import { environment } from '../../environments/environment';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    retypedPassword: '',
    accountType: 'mentor',
  });

  const [errors, setErrors] = useState({
    general: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // You can plug in your existing validation and API logic here!
    if (formData.password !== formData.retypedPassword) {
      setErrors({ general: 'Passwords do not match!' });
      return;
    }
    alert('Signup submitted!'); // Replace with your real submit logic
  };

  return (
    <div className="signup-page">
      <h1 className="signup-title">Create Account</h1>
      {errors.general && <p className="signup-error">{errors.general}</p>}

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label>Re-type Password</label>
          <input
            type="password"
            name="retypedPassword"
            placeholder="Re-type your password"
            value={formData.retypedPassword}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label>Account Type</label>
          <select name="accountType" value={formData.accountType} onChange={handleInputChange}>
            <option value="mentor">Mentor</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        <div className="terms-wrapper">
          <input type="checkbox" id="terms" required />
          <label htmlFor="terms">I accept the terms and conditions</label>
        </div>

        <div className="button-wrapper">
          <button type="submit">Sign Up</button>
        </div>
      </form>

      <div className="signup-links">
        <a href="/login">Back to Login</a>
      </div>
    </div>
  );
};

export default Signup;
