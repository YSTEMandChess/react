import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    retypedPassword: '',
    accountType: '',
    students: [],
    errors: {
      firstNameError: '',
      lastNameError: '',
      emailError: '',
      userNameError: '',
      passwordError: '',
      retypePasswordError: ''
    }
  });

  const [newStudentFlag, setNewStudentFlag] = useState(false);
  const [numNewStudents, setNumNewStudents] = useState(0);
  const history = useHistory();

  const handleBlur = (e, field) => {
    const value = e.target.value;
    const errors = formData.errors;
    switch (field) {
      case 'firstName':
        errors.firstNameError = /^[A-Za-z ]{2,15}$/.test(value) ? '' : 'Invalid First Name';
        break;
      case 'lastName':
        errors.lastNameError = /^[A-Za-z]{2,15}$/.test(value) ? '' : 'Invalid Last Name';
        break;
      case 'email':
        errors.emailError = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/.test(value) ? '' : 'Invalid Email';
        break;
      case 'username':
        errors.userNameError = /^[a-zA-Z](\S){1,14}$/.test(value) ? '' : 'Invalid Username';
        break;
      case 'password':
        errors.passwordError = value.length >= 8 ? '' : 'Invalid Password';
        break;
      case 'retypedPassword':
        errors.retypePasswordError = value === formData.password ? '' : 'Passwords do not match';
        break;
      default:
        break;
    }

    setFormData({
      ...formData,
      [field]: value,
      errors
    });
  };

  const checkIfParent = () => {
    return formData.accountType === 'parent';
  };

  const addNewStudentForm = () => {
    setNumNewStudents(numNewStudents + 1);
  };

  const removeNewStudent = (index) => {
    setFormData({
      ...formData,
      students: formData.students.filter((_, i) => i !== index)
    });
    setNumNewStudents(numNewStudents - 1);
  };

  const ifValidStudentAccount = (index) => {
    const { students } = formData;
    const student = students[index];
    const isValidStudent = student.firstName && student.lastName && student.username && student.password === student.retypedPassword;
    return isValidStudent;
  };

  const checkIfValidAccount = () => {
    const { firstName, lastName, email, username, password, retypedPassword } = formData;
    return (
      firstName &&
      lastName &&
      email &&
      username &&
      password.length >= 8 &&
      password === retypedPassword
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checkIfValidAccount()) {
      const { firstName, lastName, email, username, password, accountType, students } = formData;
      try {
        let url = `${process.env.REACT_APP_API_URL}/user/`;
        const data = {
          first: firstName,
          last: lastName,
          email,
          password,
          username,
          role: accountType,
          ...(accountType === 'parent' && { students })
        };
        const response = await axios.post(url, data);
        if (response.data !== 'This username has been taken. Please choose another.') {
          history.push('/login');
        }
      } catch (error) {
        console.error('Error during sign up:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="signupForm">
        <h2>Sign up</h2>
        <div className="errorMessages">
          {Object.values(formData.errors).map((error, idx) => (
            <h3 key={idx}>{error}</h3>
          ))}
        </div>
        <li>
          <input type="text" placeholder="First name" onBlur={(e) => handleBlur(e, 'firstName')} />
        </li>
        <li>
          <input type="text" placeholder="Last name" onBlur={(e) => handleBlur(e, 'lastName')} />
        </li>
        <li>
          <input type="text" placeholder="Email" onBlur={(e) => handleBlur(e, 'email')} />
        </li>
        <li>
          <input type="text" placeholder="Username" onBlur={(e) => handleBlur(e, 'username')} />
        </li>
        <li>
          <input type="password" placeholder="Password" onBlur={(e) => handleBlur(e, 'password')} />
        </li>
        <li>
          <input type="password" placeholder="Re-type password" onBlur={(e) => handleBlur(e, 'retypedPassword')} />
        </li>
        <li>
          <p>Select Account Type</p>
          <select name="account type" id="types" onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}>
            <option value=""></option>
            <option value="mentor">Mentor</option>
            <option value="parent">Parent</option>
          </select>
        </li>
        {checkIfParent() && (
          <>
            <button type="button" onClick={() => setNewStudentFlag(true)}>Create Student?</button>
            {newStudentFlag && (
              <div>
                {Array.from({ length: numNewStudents }).map((_, i) => (
                  <div key={i}>
                    <li>
                      <input type="text" placeholder="Student's first name" onBlur={(e) => handleBlur(e, `studentFirstName${i}`)} />
                    </li>
                    <li>
                      <input type="text" placeholder="Student's last name" onBlur={(e) => handleBlur(e, `studentLastName${i}`)} />
                    </li>
                    <li>
                      <input type="text" placeholder="Student username" onBlur={(e) => handleBlur(e, `studentUsername${i}`)} />
                    </li>
                    <li>
                      <input type="password" placeholder="Student password" onBlur={(e) => handleBlur(e, `studentPassword${i}`)} />
                    </li>
                    <li>
                      <input type="password" placeholder="Re-type password" onBlur={(e) => handleBlur(e, `studentRetypedPassword${i}`)} />
                    </li>
                    <button type="button" onClick={() => removeNewStudent(i)}>X</button>
                  </div>
                ))}
                <button type="button" onClick={addNewStudentForm}>+</button>
              </div>
            )}
          </>
        )}
        <li>
          <input type="checkbox" /><a>I accept the terms and conditions</a>
        </li>
        <button type="submit">Sign up</button>
      </div>
    </form>
  );
};

export default Signup;
