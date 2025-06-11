import React, { useState } from 'react';
import './SignUp.scss'; // Imports the stylesheet for this component.
import { environment } from '../../environments/environment'; // Imports environment variables, likely containing API URLs.
// Test comment - This is a manual test comment.

console.log('Environment URL:', environment.urls.middlewareURL); // Logs the middleware URL from the environment.

/*
const studentTemplate = React.memo(function StudentTemplate({student, onClick}) {
    return (
        <div className="item-template" onClick={onClick}>
            <div>{student.name}</div>
        </div>
    );
});
*/

const Signup = () => {
  // State to manage the form data for the user.
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    retypedPassword: '',
    accountType: 'mentor', // Default account type is set to 'mentor'.
  });

  // State flags to track the validity of individual input fields.
  const [firstNameFlag, setFirstNameFlag] = useState(false);
  const [lastNameFlag, setLastNameFlag] = useState(false);
  const [emailFlag, setEmailFlag] = useState(false);
  const [userNameFlag, setUserNameFlag] = useState(false);
  const [passwordFlag, setPasswordFlag] = useState(false);
  const [retypeFlag, setRetypeFlag] = useState(false);
  const [matchingStudents, setMatchingStudents] = useState([]);
  const [usernameToSearch, setUserToSearch] = useState('');

  // State to store any validation errors for the form fields.
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    retypePassword: '',
  });

  // State to manage the parent account specific UI and data.
  const [parentAccountFlag, setParentAccountFlag] = useState(false); // Flag to indicate if the selected account type is 'parent'.
  const [showStudentForm, setShowStudentForm] = useState(false); // Flag to control the visibility of the student creation form.
  const [students, setStudents] = useState<any>([]); // State to store data for student accounts under a parent.

  // Handles changes to input fields in the main form.
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    // Updates the formData state with the new value for the changed field.
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Performs specific validation based on the input field that changed.
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

  // Verifies the format of the first name.
  const firstNameVerification = (firstName: string) => {
    const isValid = /^[A-Za-z ]{2,15}$/.test(firstName);
    setFirstNameFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      firstName: isValid ? '' : 'Invalid First Name',
    }));
    return isValid;
  };

  // Verifies the format of the last name.
  const lastNameVerification = (lastName: string) => {
    const isValid = /^[A-Za-z]{2,15}$/.test(lastName);
    setLastNameFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      lastName: isValid ? '' : 'Invalid Last Name',
    }));
    return isValid;
  };

  // Verifies the format of the email address.
  const emailVerification = (email: string) => {
    const isValid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/.test(email);
    setEmailFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      email: isValid ? '' : 'Invalid Email',
    }));
    return isValid;
  };

  // Verifies the format of the username.
  const usernameVerification = (username: string) => {
    const isValid = /^[a-zA-Z](\S){1,14}$/.test(username);
    setUserNameFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      username: isValid ? '' : 'Invalid Username',
    }));
    return isValid;
  };

  // Verifies the length of the password.
  const passwordVerification = (password: string) => {
    const isValid = password.length >= 8;
    setPasswordFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      password: isValid ? '' : 'Password must be at least 8 characters',
    }));
    return isValid;
  };

  // Verifies if the retyped password matches the original password.
  const retypePasswordVerification = (retypedPassword: string, password: string) => {
    const isValid = retypedPassword === password;
    setRetypeFlag(isValid);
    setErrors((prev) => ({
      ...prev,
      retypePassword: isValid ? '' : 'Passwords do not match',
    }));
    return isValid;
  };

  // Handles changes to the account type dropdown.
  const handleAccountTypeChange = (e: any) => {
    const isParent = e.target.value === 'parent';
    setParentAccountFlag(isParent);
    // Updates the accountType in the form data.
    setFormData((prev) => ({
      ...prev,
      accountType: e.target.value,
    }));
  };

  // Adds a new student form to the UI for parent accounts.
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
    setShowStudentForm(true); // Makes the student form visible.
  };

  // Handles changes to input fields within a student's form.
  const handleStudentInputChange = (studentId: any, field: string, value: string) => {
    // Updates the specific student's data in the students array.
    setStudents((prev: any) =>
      prev.map((student: any) =>
        student.id === studentId ? { ...student, [field]: value } : student
      )
    );
  };

  // Removes a student form from the UI.
  const handleRemoveStudent = (studentId: any) => {
    // Filters out the student with the given ID.
    setStudents((prev: any) => prev.filter((student: any) => student.id !== studentId));
    // Hides the student form if no students are present.
    if (students.length === 1) {
      setShowStudentForm(false);
    }
  };

  const handleMenteeChange = (currentText) => {
    
  }

  // Handles the submission of the signup form.
  const handleSubmit = async () => {
    console.log('Submit clicked', formData);

    // Checks if all main form fields are valid based on their flags.
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

    // If the main form is not valid, prevents submission.
    if (!isValid) {
      console.log('Form validation failed');
      return;
    }

    let url = '';
    // Constructs the API URL based on whether it's a parent account with students.
    if (parentAccountFlag && students.length > 0) {
      // Maps student data into the required format for the API.
      const studentsData = students.map((student: any) => ({
        first: student.firstName,
        last: student.lastName,
        email: student.email,
        username: student.username,
        password: student.password,
      }));

      // Constructs the URL with parent and student data.
      url = `${environment.urls.middlewareURL}/user/?first=${
        formData.firstName
      }&last=${formData.lastName}&email=${formData.email}&password=${
        formData.password
      }&username=${formData.username}&role=${
        formData.accountType
      }&students=${JSON.stringify(studentsData)}`;
    } else {
      // Constructs the URL for non-parent accounts.
      url = `${environment.urls.middlewareURL}/user/?first=${formData.firstName}&last=${formData.lastName}&email=${formData.email}&password=${formData.password}&username=${formData.username}&role=${formData.accountType}`;
    }

    console.log('Request URL:', url);

    try {
      // Sends a POST request to the signup API.
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      // Throws an error if the response status indicates failure.
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parses the JSON response.
      const data = await response.json();
      console.log('Response data:', data);

      // Handles the case where the chosen username is already taken.
      if (data === 'This username has been taken. Please choose another.') {
        setErrors((prev) => ({
          ...prev,
          username: 'Username already taken',
        }));
      } else {
        // Redirects to the homepage upon successful signup.
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Signup error:', error);
      // Sets a general error message for signup failure.
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
        {/* Maps through the errors object and displays any error messages. */}
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

      {!parentAccountFlag && (
        <input type="text" name="setMentee" placeholder="Find a student" value={usernameToSearch} onChange={handleMenteeChange}/>
        
      )}

      {/* Conditional rendering of the student section for parent accounts. */}
      {parentAccountFlag && (
        <div className='student-section'>
          {/* Button to add a new student form if the student form is not currently shown. */}
          {!showStudentForm && (
            <button
              type='button'
              className='add-student-btn'
              onClick={handleAddStudent}
            >
              Create Student
            </button>
          )}

          {/* Maps through the students array and renders a form for each student. */}
          {students.map((student: any) => (
            <div key={student.id} className='student-form'>
              {/* Button to remove a student form. */}
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

      {/* Submit button for the signup form. */}
      <button type='button' className='submit-btn' onClick={handleSubmit}>
        Sign up
      </button>
    </form>
  );
};

export default Signup;