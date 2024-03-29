import React from 'react'
import "./SignUp.scss"
const SignUp = () => {
  return (
    <>
      <h2>Signup</h2>
      <form className="input-container">
        <div className="account-details-container">
          <div className="account-detail">
            <input type="text" name="firstName" id="firstName" required />
            <div className="underline"></div>
            <label htmlFor="firstName">First name</label>
          </div>
          <div className="account-detail">
            <input type="text" name="lastName" id="lastName" required />
            <div className="underline"></div>
            <label htmlFor="lastName">Last name</label>
          </div>
        </div>
        <div className="email-detail account-detail">
          <input type="email" name="email" id="email" required />
          <div className="underline"></div>
          <label htmlFor="email">Email</label>
        </div>

        <div className="account-details-container">
          <div className="account-detail">
            <input type="text" name="username" id="username" required />
            <div className="underline"></div>
            <label htmlFor="username">Username</label>
          </div>
          <div className="account-detail">
            <input type="password" name="password" id="password" required />
            <div className="underline"></div>
            <label htmlFor="password">Password</label>
          </div>
        </div>

        <div className="account-details-container">
          <div className="account-detail">
            <input
              type="password"
              name="retype-password"
              id="retype-password"
              required
            />
            <div className="underline"></div>
            <label htmlFor="retype-password">Retype password</label>
          </div>
          <div className="account-type-container">
            <label for="account-type">Select Account Type</label>
            <select name="account-type" id="account-type">
              <option value="select">Select</option>
              <option value="mentor">Mentor</option>
              <option value="parent">Parent</option>
            </select>
          </div>
        </div>
        <div className="terms-container">
          <input type="checkbox" name="terms" id="terms" />
          <label htmlFor="terms">I accept the terms and conditions</label>
        </div>
        <button>Sign Up</button>
      </form>
    </>
  );
}

export default SignUp