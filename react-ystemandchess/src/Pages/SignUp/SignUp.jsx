import React, { useState } from 'react';
import './SignUp.scss';
import { environment } from '../../environments/environment.js';

const Signup = () => {
  //states from angular (clean up later)
  const [link, setLink] = useState(null);
  const [firstNameFlag, setFirstNameFlag] = useState(false);
  const [lastNameFlag, setLastNameFlag] = useState(false);
  const [emailFlag, setEmailFlag] = useState(false);
  const [userNameFlag, setUserNameFlag] = useState(false);
  const [passwordFlag, setPasswordFlag] = useState(false);
  const [retypeFlag, setRetypeFlag] = useState(false);

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [userNameError, setUserNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [retypePasswordError, setRetypePasswordError] = useState('');

  const [parentAccountFlag, setParentAccountFlag] = useState(false);
  const [numStudents, setNumStudents] = useState([]);
  const [newStudents, setNewStudents] = useState([]);
  const [newStudentFlag, setNewStudentFlag] = useState(false);
  const [studentFirstNameFlag, setStudentFirstNameFlag] = useState(false);
  const [studentLastNameFlag, setStudentLastNameFlag] = useState(false);
  const [studentUserNameFlag, setStudentUserNameFlag] = useState(false);
  const [studentPasswordFlag, setStudentPasswordFlag] = useState(false);
  const [studentRetypeFlag, setStudentRetypeFlag] = useState(false);
  const [studentEmailFlag, setStudentEmailFlag] = useState(true);
  const [numNewStudents, setNumNewStudents] = useState(0);

  const firstNameVerification = (firstName) => {
    if (/^[A-Za-z ]{2,15}$/.test(firstName)) {
      setFirstNameFlag(true);
      setFirstNameError('');
      return true;
    } else {
      setFirstNameFlag(false);
      setFirstNameError('Invalid First Name');
      return false;
    }
  };

  const lastNameVerification = (lastName) => {
    if (/^[A-Za-z]{2,15}$/.test(lastName)) {
      setLastNameFlag(true);
      setLastNameError('');
      return true;
    } else {
      setLastNameFlag(false);
      setLastNameError('Invalid Last Name');
      return false;
    }
  };

  const emailVerification = (email) => {
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/.test(email)) {
      setEmailFlag(true);
      setEmailError('');
      return true;
    } else {
      setEmailFlag(false);
      setEmailError('Invalid Email');
      return false;
    }
  };

  const usernameVerification = (username) => {
    if (/^[a-zA-Z](\S){1,14}$/.test(username)) {
      setUserNameFlag(true);
      setUserNameError('');
      return true;
    } else {
      setUserNameFlag(false);
      setUserNameError('Invalid Username');
      return false;
    }
  };

  const passwordVerification = (password) => {
    if (password.length < 8) {
      setPasswordFlag(false);
      setPasswordError('Invalid Password');
      return false;
    } else {
      setPasswordFlag(true);
      setPasswordError('');
      return true;
    }
  };

  const retypePasswordVerification = (retypedPassword, password) => {
    if (retypedPassword === password) {
      setRetypeFlag(true);
      setRetypePasswordError('');
      return true;
    } else {
      setRetypeFlag(false);
      setRetypePasswordError('Passwords do not match');
      return false;
    }
  };

  const checkIfValidAccount = () => {
    if (
      firstNameFlag &&
      lastNameFlag &&
      emailFlag &&
      userNameFlag &&
      passwordFlag &&
      retypeFlag
    ) {
      setLink('/login');
      return true;
    } else {
      setLink(null);
      return false;
    }
  };

  const checkIfParent = () => {
    const accountType = document.getElementById('types').value;
    if (accountType === 'parent') {
      setParentAccountFlag(true);
    } else {
      setParentAccountFlag(false);
    }
    return parentAccountFlag;
  };

  const clearNulls = (arr) => {
    return arr.filter((item) => item !== null);
  };

  const addStudentToArray = (index) => {
    return {
      first: document.getElementById('studentFirstName' + index).value,
      last: document.getElementById('studentLastName' + index).value,
      username: document.getElementById('studentUsername' + index).value,
      email: document.getElementById('studentEmail' + index).value,
      password: document.getElementById('studentPassword' + index).value,
    };
  };

  const studentFirstNameVerification = (firstName, index) => {
    if (/^[A-Za-z ]{2,15}$/.test(firstName)) {
      setStudentFirstNameFlag(true);
      document.getElementById('errorFirstName' + index).innerHTML = '';
      return true;
    } else {
      setStudentFirstNameFlag(false);
      document.getElementById('errorFirstName' + index).innerHTML =
        'Invalid First Name';
      return false;
    }
  };

  const SendToDataBase = () => {
    if (!checkIfValidAccount()) {
      return;
    }

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    const accountType = document.getElementById('types').value;

    let url = '';

    if (accountType === 'parent' && newStudentFlag) {
      const cleanedStudents = clearNulls(newStudents);
      const students = JSON.stringify(cleanedStudents);
      url = `${environment.urls.middlewareURL}/user/?first=${firstName}&last=${lastName}&email=${email}&password=${password}&username=${username}&role=${accountType}&students=${students}`;
    } else {
      url = `${environment.urls.middlewareURL}/user/?first=${firstName}&last=${lastName}&email=${email}&password=${password}&username=${username}&role=${accountType}`;
    }

    const httpGetAsync = (theUrl, callback) => {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
          callback(xmlHttp.responseText);
      };
      xmlHttp.open('POST', theUrl, true);
      xmlHttp.send(null);
    };

    httpGetAsync(url, (response) => {
      if (
        JSON.parse(response) ===
        'This username has been taken. Please choose another.'
      ) {
        setLink('/signup');
      }
    });
  };

  return (
    <form className='signupForm'>
      <h2>Sign up</h2>
      <div className='errorMessages'>
        <h3>{firstNameError}</h3>
        <h3>{lastNameError}</h3>
        <h3>{emailError}</h3>
        <h3>{userNameError}</h3>
        <h3>{passwordError}</h3>
        <h3>{retypePasswordError}</h3>
      </div>

      <div>
        <input
          type='text'
          id='firstName'
          placeholder='First name'
          onChange={(e) => firstNameVerification(e.target.value)}
        />
        <input
          type='text'
          id='lastName'
          placeholder='Last name'
          onChange={(e) => lastNameVerification(e.target.value)}
        />
        <input
          type='text'
          id='email'
          placeholder='Email'
          onChange={(e) => emailVerification(e.target.value)}
        />
        <input
          type='text'
          id='username'
          placeholder='Username'
          onChange={(e) => usernameVerification(e.target.value)}
        />
        <input
          type='password'
          id='password'
          placeholder='Password'
          onChange={(e) => passwordVerification(e.target.value)}
        />
        <input
          type='password'
          id='retypedPassword'
          placeholder='Re-type password'
          onChange={(e) =>
            retypePasswordVerification(
              e.target.value,
              document.getElementById('password').value
            )
          }
        />
      </div>

      <p>Select Account Type</p>
      <select id='types' onChange={checkIfParent}>
        <option value='mentor'>Mentor</option>
        <option value='parent'>Parent</option>
      </select>

      {parentAccountFlag && (
        <div>
          {!newStudentFlag && (
            <button
              type='button'
              id='create'
              onClick={() => {
                setNewStudentFlag(true);
                document.getElementById('create').style.display = 'none';
                setNumStudents([...numStudents, 0]);
                setNumNewStudents(numNewStudents + 1);
              }}
            >
              Create Student?
            </button>
          )}

          {numStudents.map((_, i) => (
            <div key={i} id={`newStudent${i}`}>
              <div id={`error${i}`} className='errorMessages'>
                <h3 id={`errorFirstName${i}`}></h3>
                <h3 id={`errorLastName${i}`}></h3>
                <h3 id={`errorUsername${i}`}></h3>
                <h3 id={`errorPassword${i}`}></h3>
                <h3 id={`errorRetype${i}`}></h3>
              </div>

              <button
                type='button'
                className='x'
                onClick={() => {
                  if (numNewStudents === 1) {
                    setNewStudentFlag(false);
                    setNumStudents([]);
                    setNumNewStudents(0);
                    setNewStudents([]);
                    document.getElementById('create').style.display = 'inline';
                  } else {
                    document.getElementById(`newStudent${i}`).style.display =
                      'none';
                    const prevIndex = i !== 0 ? i - 1 : i;
                    document.getElementById(`plus${prevIndex}`).style.display =
                      'inline';
                    setNewStudents((prev) => {
                      const newArray = [...prev];
                      newArray[i] = null;
                      return newArray;
                    });
                    setNumNewStudents((prev) => prev - 1);
                  }
                }}
              >
                X
              </button>

              <input
                type='text'
                id={`studentFirstName${i}`}
                placeholder="Student's first name"
              />
              <input
                type='text'
                id={`studentLastName${i}`}
                placeholder="Student's last name"
              />
              <input
                type='text'
                id={`studentUsername${i}`}
                placeholder='Student username'
              />
              <input
                type='text'
                id={`studentEmail${i}`}
                placeholder="Student's email"
              />
              <input
                type='password'
                id={`studentPassword${i}`}
                placeholder="Student's password"
              />
              <input
                type='password'
                id={`studentRetypedPassword${i}`}
                placeholder="Re-type student's password"
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <input type='checkbox' id='termsCheckbox' />
        <label htmlFor='termsCheckbox'>I accept the terms and conditions</label>
      </div>

      <button type='button' onClick={SendToDataBase}>
        Sign up
      </button>
    </form>
  );
};

export default Signup;
