import React, { useState } from 'react';
import Header from '../../Header/Header';
import Footer from '../../Footer/Footer';
import './contact.css';


const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const isNameValid = name.trim() !== '';
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = isNameValid && isEmailValid && message.trim() !== '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      console.log({ name, email, message });
    }
  };

  return (
    <>
      <Header />
      <div className="form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="fullname">Name</label>
            <input
              autoComplete="off"
              className="form-control"
              type="text"
              name="name"
              id="fullname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              required
            />
            {!isNameValid && nameTouched && (
              <div className="help is-error">Please enter your name.</div>
            )}
          </div>

          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              autoComplete="off"
              className="form-control"
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              required
            />
            {!isEmailValid && emailTouched && (
              <div className="help is-error">Please insert a valid email.</div>
            )}
          </div>

          <div className="form-group">
            <label className="label" htmlFor="message">Message</label>
            <textarea
              className="form-control"
              name="message"
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn" disabled={!isFormValid}>
            Send!
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Contact;
