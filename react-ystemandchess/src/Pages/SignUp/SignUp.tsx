import React, { useState } from 'react';
import './SignUp.scss';
import { environment } from '../../environments/environment';
// Test comment

console.log('Environment URL:', environment.urls.middlewareURL);

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

  const [firstNameFlag, setFirstNameFlag] = useState(false);
  const [lastNameFlag, setLastNameFlag] = useState(false);
  const [emailFlag, setEmailFlag] = useState(false);
  const [userNameFlag, setUserNameFlag] = useState(false);
  const [passwordFlag, setPasswordFlag] = useState(false);
  const [retypeFlag, setRetypeFlag] = useState(false);

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    retypePassword: '',
  });

  const [parentAccountFlag, setParentAccountFlag] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [students, setStudents] = useState<any>([]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    switch (name) {
      case 'firstName':
        firstNameVerification(value);
        break;
      case 'lastName':
        lastNameVerification(value);
        break;
      case 'email':
        emailVerification(value);
        break;
      case 'username':
        usernameVerification(value);
        break;
      case 'password':
        passwordVerification(value);
        break;
      case 'retypedPassword':
        retypePasswordVerification(value, formData.password);
        break;
      default:
        break;
    }
  };

  const firstNameVerification = (firstName: string) => {
    const isValid = /^[A-Za-z ]{2,15}$/.test(firstName);
    setFirstNameFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      firstName: isValid ? '' : 'Invalid First Name',
    }));
    return isValid;
  };

  const lastNameVerification = (lastName: string) => {
    const isValid = /^[A-Za-z]{2,15}$/.test(lastName);
    setLastNameFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      lastName: isValid ? '' : 'Invalid Last Name',
    }));
    return isValid;
  };

  const emailVerification = (email: string) => {
    const isValid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/.test(email);
    setEmailFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      email: isValid ? '' : 'Invalid Email',
    }));
    return isValid;
  };

  const usernameVerification = (username: string) => {
    const isValid = /^[a-zA-Z](\S){1,14}$/.test(username);
    setUserNameFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      username: isValid ? '' : 'Invalid Username',
    }));
    return isValid;
  };

  const passwordVerification = (password: string) => {
    const isValid = password.length >= 8;
    setPasswordFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      password: isValid ? '' : 'Password must be at least 8 characters',
    }));
    return isValid;
  };

  const retypePasswordVerification = (retypedPassword: string, password: string) => {
    const isValid = retypedPassword === password;
    setRetypeFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      retypePassword: isValid ? '' : 'Passwords do not match',
    }));
    return isValid;
  };

  const handleAccountTypeChange = (e: any) => {
    const isParent = e.target.value === 'parent';
    setParentAccountFlag(isParent);
    setFormData((prev) => ({
      ...prev,
      accountType: e.target.value,
    }));
  };

  const handleAddStudent = () => {
    const newStudent = {
      id: Date.now(),
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      retypedPassword: '',
      errors: {},
    };
    setStudents((prev: any) => [...prev, newStudent]);
    setShowStudentForm(true);
  };

  const handleStudentInputChange = (studentId: any, field: string, value: string) => {
    setStudents((prev: any) =>
      prev.map((student: any) =>
        student.id === studentId ? { ...student, [field]: value } : student
      )
    );
  };

  const handleRemoveStudent = (studentId: any) => {
    setStudents((prev: any) => prev.filter((student: any) => student.id !== studentId));
    if (students.length === 1) {
      setShowStudentForm(false);
    }
  };

  const handleSubmit = async () => {
    console.log('Submit clicked', formData);

    const isValid =
      firstNameFlag &&
      lastNameFlag &&
      emailFlag &&
      userNameFlag &&
      passwordFlag &&
      retypeFlag;

    console.log('Validation status:', {
      firstNameFlag,
      lastNameFlag,
      emailFlag,
      userNameFlag,
      passwordFlag,
      retypeFlag,
    });

    if (!isValid) {
      console.log('Form validation failed');
      return;
    }

    let url = '';
    if (parentAccountFlag && students.length > 0) {
      const studentsData = students.map((student: any) => ({
        first: student.firstName,
        last: student.lastName,
        email: student.email,
        username: student.username,
        password: student.password,
      }));

      url = `${environment.urls.middlewareURL}/user/?first=${
        formData.firstName
      }&last=${formData.lastName}&email=${formData.email}&password=${
        formData.password
      }&username=${formData.username}&role=${
        formData.accountType
      }&students=${JSON.stringify(studentsData)}`;
    } else {
      url = `${environment.urls.middlewareURL}/user/?first=${formData.firstName}&last=${formData.lastName}&email=${formData.email}&password=${formData.password}&username=${formData.username}&role=${formData.accountType}`;
    }

    console.log('Request URL:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data === 'This username has been taken. Please choose another.') {
        setErrors((prev) => ({
          ...prev,
          username: 'Username already taken',
        }));
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors((prev) => ({
        ...prev,
        general: 'Signup failed. Please try again.',
      }));
    }
  };

  return (
    <form className='signupForm' onSubmit={(e) => e.preventDefault()}>
      <h2 className="sign-up-title">Sign up</h2>

      <div className='errorMessages'>
        {Object.values(errors).map((error, index) =>
          error ? <h3 key={index}>{error}</h3> : null
        )}
      </div>

      <div className='form-fields'>
        <input
          type='text'
          name='firstName'
          placeholder='First name'
          value={formData.firstName}
          onChange={handleInputChange}
        />
        <input
          type='text'
          name='lastName'
          placeholder='Last name'
          value={formData.lastName}
          onChange={handleInputChange}
        />
        <input
          type='text'
          name='email'
          placeholder='Email'
          value={formData.email}
          onChange={handleInputChange}
        />
        <input
          type='text'
          name='username'
          placeholder='Username'
          value={formData.username}
          onChange={handleInputChange}
        />
        <input
          type='password'
          name='password'
          placeholder='Password'
          value={formData.password}
          onChange={handleInputChange}
        />
        <input
          type='password'
          name='retypedPassword'
          placeholder='Re-type password'
          value={formData.retypedPassword}
          onChange={handleInputChange}
        />
      </div>

      <div className='account-type'>
        <p>Select Account Type</p>
        <select value={formData.accountType} onChange={handleAccountTypeChange}>
          <option value='mentor'>Mentor</option>
          <option value='parent'>Parent</option>
        </select>
      </div>

      {parentAccountFlag && (
        <div className='student-section'>
          {!showStudentForm && (
            <button
              type='button'
              className='add-student-btn'
              onClick={handleAddStudent}
            >
              Create Student
            </button>
          )}

          {students.map((student: any) => (
            <div key={student.id} className='student-form'>
              <button
                type='button'
                className='remove-student'
                onClick={() => handleRemoveStudent(student.id)}
              >
                Delete student
              </button>

              <input
                type='text'
                placeholder="Student's first name"
                value={student.firstName}
                onChange={(e) =>
                  handleStudentInputChange(
                    student.id,
                    'firstName',
                    e.target.value
                  )
                }
              />
              <input
                type='text'
                placeholder="Student's last name"
                value={student.lastName}
                onChange={(e) =>
                  handleStudentInputChange(
                    student.id,
                    'lastName',
                    e.target.value
                  )
                }
              />
              <input
                type='text'
                placeholder='Student username'
                value={student.username}
                onChange={(e) =>
                  handleStudentInputChange(
                    student.id,
                    'username',
                    e.target.value
                  )
                }
              />
              <input
                type='text'
                placeholder="Student's email"
                value={student.email}
                onChange={(e) =>
                  handleStudentInputChange(student.id, 'email', e.target.value)
                }
              />
              <input
                type='password'
                placeholder="Student's password"
                value={student.password}
                onChange={(e) =>
                  handleStudentInputChange(
                    student.id,
                    'password',
                    e.target.value
                  )
                }
              />
              <input
                type='password'
                placeholder="Re-type student's password"
                value={student.retypedPassword}
                onChange={(e) =>
                  handleStudentInputChange(
                    student.id,
                    'retypedPassword',
                    e.target.value
                  )
                }
              />
            </div>
          ))}
        </div>
      )}

      <div className='terms'>
        <input type='checkbox' id='termsCheckbox' required />
        <label htmlFor='termsCheckbox'>I accept the terms and conditions</label>
      </div>

      <button type='button' className='submit-btn' onClick={handleSubmit}>
        Sign up
      </button>
    </form>
  );
};

export default Signup;
