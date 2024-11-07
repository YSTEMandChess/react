import React, { useState } from 'react';
import axios from 'axios';
import './SignUp.scss';
import { environment } from '../../environments/environment.js';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [retypedPassword, setRetypedPassword] = useState('');
  const [accountType, setAccountType] = useState('');
  const [newStudents, setNewStudents] = useState([]);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [userNameError, setUserNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [retypePasswordError, setRetypePasswordError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false); // Checkbox state
  const [link, setLink] = useState(null);
  const [numNewStudents, setNumNewStudents] = useState(0);

  const firstNameVerificationREGEX = /^[A-Za-z ]{2,15}$/;
  const lastNameVerificationREGEX = /^[A-Za-z]{2,15}$/;
  const emailVerificationREGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/;
  const usernameVerificationREGEX = /^[a-zA-Z](\S){1,14}$/;

  const validateFirstName = (name) => {
    if (firstNameVerificationREGEX.test(name)) {
      setFirstNameError('');
      return true;
    } else {
      setFirstNameError('Invalid First Name');
      return false;
    }
  };

  const validateLastName = (name) => {
    if (lastNameVerificationREGEX.test(name)) {
      setLastNameError('');
      return true;
    } else {
      setLastNameError('Invalid Last Name');
      return false;
    }
  };

  const validateEmail = (email) => {
    if (emailVerificationREGEX.test(email)) {
      setEmailError('');
      return true;
    } else {
      setEmailError('Invalid Email');
      return false;
    }
  };

  const validateUsername = (username) => {
    if (usernameVerificationREGEX.test(username)) {
      setUserNameError('');
      return true;
    } else {
      setUserNameError('Invalid Username');
      return false;
    }
  };

  const validatePassword = (password) => {
    if (password.length >= 8) {
      setPasswordError('');
      return true;
    } else {
      setPasswordError('Invalid Password');
      return false;
    }
  };

  const validateRetypedPassword = (retypedPassword, password) => {
    if (retypedPassword === password) {
      setRetypePasswordError('');
      return true;
    } else {
      setRetypePasswordError('Passwords do not match');
      return false;
    }
  };

  const checkIfValidAccount = () => {
    if (
      validateFirstName(firstName) &&
      validateLastName(lastName) &&
      validateEmail(email) &&
      validateUsername(username) &&
      validatePassword(password) &&
      validateRetypedPassword(retypedPassword, password)
    ) {
      setLink('/login');
      return true;
    } else {
      setLink(null);
      return false;
    }
  };

  const handleAccountTypeChange = (e) => {
    setAccountType(e.target.value);
  };

  const handleCreateNewStudent = () => {
    setNewStudents([...newStudents, { firstName: '', lastName: '', username: '', email: '', password: '', retypedPassword: '' }]);
    setNumNewStudents(numNewStudents + 1);
  };

  const handleStudentChange = (index, field, value) => {
    const updatedStudents = newStudents.map((student, i) =>
      i === index ? { ...student, [field]: value } : student
    );
    setNewStudents(updatedStudents);
  };

  const handleRemoveStudent = (index) => {
    const updatedStudents = newStudents.filter((_, i) => i !== index);
    setNewStudents(updatedStudents);
    setNumNewStudents(numNewStudents - 1);
  };

  const handleAddNewStudentForm = () => {
    handleCreateNewStudent();
  };

  const handleTermsCheckboxChange = (e) => {
    setTermsAccepted(e.target.checked);
  };

  const sendToDatabase = async (e) => {
    e.preventDefault();

    if (!checkIfValidAccount() || !termsAccepted) {
      return;
    }

    const baseURL = environment.urls.middlewareURL;
    if (!baseURL) {
      console.error('Middleware URL is not defined');
      return;
    }

    let url = `${baseURL}/user/?first=${firstName}&last=${lastName}&email=${email}&password=${password}&username=${username}&role=${accountType}`;

    if (accountType === 'parent' && newStudents.length > 0) {
      url += `&students=${encodeURIComponent(JSON.stringify(newStudents))}`;
    }

    console.log('Request URL:', url);

    try {
      const response = await axios.post(url);
      if (response.data === 'This username has been taken. Please choose another.') {
        setLink('/signup');
      } else {
        setLink('/login');
      }
    } catch (error) {
      console.error('There was an error!', error);
    }
  };

  return (
    <form className="signupForm" onSubmit={sendToDatabase}>
      <h2>Sign up</h2>
      <div className="errorMessages" style={{ display: (firstNameError || lastNameError || emailError || userNameError || passwordError || retypePasswordError) ? 'block' : 'none' }}>
        <h3>{firstNameError}</h3>
        <h3>{lastNameError}</h3>
        <h3>{emailError}</h3>
        <h3>{userNameError}</h3>
        <h3>{passwordError}</h3>
        <h3>{retypePasswordError}</h3>
      </div>
      <div className="formInputs">
        <input
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onBlur={() => validateFirstName(firstName)}
        />
        <input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          onBlur={() => validateLastName(lastName)}
        />
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => validateEmail(email)}
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => validateUsername(username)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => validatePassword(password)}
        />
        <input
          type="password"
          placeholder="Re-type password"
          value={retypedPassword}
          onChange={(e) => setRetypedPassword(e.target.value)}
          onBlur={() => validateRetypedPassword(retypedPassword, password)}
        />
        <p>Select Account Type</p>
        <select value={accountType} onChange={handleAccountTypeChange}>
          <option value="student">Student</option>
          <option value="mentor">Mentor</option>
          <option value="parent">Parent</option>
        </select>
        {accountType === 'parent' && (
          <div>
            <button type="button" id="create" onClick={handleCreateNewStudent}>
              Create Student?
            </button>
            {newStudents.map((student, index) => (
              <div key={index}>
                <div className="errorMessages">
                  <h3>{/* Error messages for students */}</h3>
                </div>
                <button type="button" className="x" onClick={() => handleRemoveStudent(index)}>
                  X
                </button>
                <input
                  type="text"
                  placeholder="Student's first name"
                  value={student.firstName}
                  onChange={(e) => handleStudentChange(index, 'firstName', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Student's last name"
                  value={student.lastName}
                  onChange={(e) => handleStudentChange(index, 'lastName', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Student username"
                  value={student.username}
                  onChange={(e) => handleStudentChange(index, 'username', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Student's email"
                  value={student.email}
                  onChange={(e) => handleStudentChange(index, 'email', e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Student's password"
                  value={student.password}
                  onChange={(e) => handleStudentChange(index, 'password', e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Re-type student's password"
                  value={student.retypedPassword}
                  onChange={(e) => handleStudentChange(index, 'retypedPassword', e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
        </div>
          <div className="termsCheckbox">
         
          <input
            type="checkbox"
            id="termsCheckbox"
            checked={termsAccepted}
            onChange={handleTermsCheckboxChange}
          />
          <label htmlFor="termsCheckbox">I accept the terms and conditions</label>

        </div>
  
  {/* Submit Button */}
  <div className='signUpButton'>
  <input
    type="submit"
    value="Submit"
    className="submitButton" // Add a class for styling
    style={{
      border: '1px solid black',
      backgroundColor: 'transparent',
      color: 'black',
      padding: '10px 20px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease, color 0.3s ease',
      marginTop: '10px', // Add some space above the button
    }}
    onMouseEnter={(e) => {
      e.target.style.backgroundColor = 'blue';
      e.target.style.color = 'white';
    }}
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = 'transparent';
      e.target.style.color = 'black';
    }}
  />
   </div>  
    </form>
  );  
};

export default Signup;

