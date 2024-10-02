import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import Header from '../../Header/Header';
import Footer from '../../Footer/Footer';
import './ParentAddStudent.css';
import { useNavigate } from 'react-router-dom';


const ParentAddStudent = () => {
  const [numStudents, setNumStudents] = useState([0]);
  const [newStudents, setNewStudents] = useState([]);
  const [username, setUsername] = useState('');
  const [link, setLink] = useState(null);
  const [cookies] = useCookies(['login']);
  const history = useHistory();

  useEffect(() => {
    getUsername();
  }, []);

  const getUsername = async () => {
    const userInfo = await setPermissionLevel(cookies);
    if (!userInfo.error) {
      setUsername(userInfo.username);
    }
  };

  const handleVerification = (e, index, type) => {
    const value = e.target.value;
    let valid = false;
    let errorMessage = '';

    switch (type) {
      case 'firstName':
        valid = /^[A-Za-z]{2,15}$/.test(value);
        errorMessage = valid ? '' : 'Invalid First Name';
        break;
      case 'lastName':
        valid = /^[A-Za-z]{2,15}$/.test(value);
        errorMessage = valid ? '' : 'Invalid Last Name';
        break;
      case 'username':
        valid = /^[a-zA-Z](\S){1,14}$/.test(value);
        errorMessage = valid ? '' : 'Invalid Username';
        break;
      case 'email':
        valid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/.test(value);
        errorMessage = valid ? '' : 'Invalid Email';
        break;
      case 'password':
        valid = value.length >= 8;
        errorMessage = valid ? '' : 'Invalid Password';
        break;
      case 'retype':
        const password = document.getElementById(`studentPassword${index}`).value;
        valid = value === password;
        errorMessage = valid ? '' : 'Passwords do not match';
        break;
      default:
        break;
    }

    document.getElementById(`error${type.charAt(0).toUpperCase() + type.slice(1)}${index}`).innerText = errorMessage;

    if (valid) {
      updateStudentInfo(index, type, value);
    }
  };

  const updateStudentInfo = (index, field, value) => {
    let updatedStudents = [...newStudents];
    if (!updatedStudents[index]) updatedStudents[index] = {};
    updatedStudents[index][field] = value;
    setNewStudents(updatedStudents);
  };

  const addNewStudentForm = (index) => {
    setNumStudents([...numStudents, index + 1]);
  };

  const removeNewStudent = (index) => {
    if (numStudents.length > 1) {
      let updatedStudents = newStudents.filter((_, i) => i !== index);
      setNumStudents(numStudents.filter((_, i) => i !== index));
      setNewStudents(updatedStudents);
    }
  };

  const SendToDataBase = () => {
    if (!link) return;

    const parentUser = username;

    newStudents.forEach((student) => {
      const url = `${process.env.REACT_APP_MIDDLEWARE_URL}/user/children?first=${student.first}&last=${student.last}&username=${student.username}&email=${student.email}&password=${student.password}`;

      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cookies.login}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data === 'This username has been taken. Please choose another.') {
            setLink('/parent-add-student');
          } else {
            history.push('/login');
          }
        });
    });
  };

  return (
    <>
      <Header />
      <div className="signupForm">
        {numStudents.map((_, i) => (
          <div key={i} id={`newStudent${i}`}>
            <div id={`error${i}`} className="errorMessages">
              <h3 id={`errorFirstName${i}`}></h3>
              <h3 id={`errorLastName${i}`}></h3>
              <h3 id={`errorUsername${i}`}></h3>
              <h3 id={`errorEmail${i}`}></h3>
              <h3 id={`errorPassword${i}`}></h3>
              <h3 id={`errorRetype${i}`}></h3>
            </div>
            {numStudents.length > 1 && (
              <button type="button" className="x" onClick={() => removeNewStudent(i)}>
                X
              </button>
            )}
            <li>
              <input
                type="text"
                placeholder="Student's first name"
                id={`studentFirstName${i}`}
                onBlur={(e) => handleVerification(e, i, 'firstName')}
              />
            </li>
            <li>
              <input
                type="text"
                placeholder="Student's last name"
                id={`studentLastName${i}`}
                onBlur={(e) => handleVerification(e, i, 'lastName')}
              />
            </li>
            <li>
              <input
                type="text"
                placeholder="Student username"
                id={`studentUsername${i}`}
                onBlur={(e) => handleVerification(e, i, 'username')}
              />
            </li>
            <li>
              <input
                type="text"
                placeholder="Student email"
                id={`studentEmail${i}`}
                onBlur={(e) => handleVerification(e, i, 'email')}
              />
            </li>
            <li>
              <input
                type="password"
                placeholder="Student password"
                id={`studentPassword${i}`}
                onBlur={(e) => handleVerification(e, i, 'password')}
              />
            </li>
            <li>
              <input
                type="password"
                placeholder="Re-type password"
                id={`studentRetypedPassword${i}`}
                onBlur={(e) => handleVerification(e, i, 'retype')}
              />
            </li>
            <button type="button" className="x" onClick={() => addNewStudentForm(i)}>
              +
            </button>
          </div>
        ))}
        <button type="submit" onClick={SendToDataBase}>
          Sign up
        </button>
      </div>
      <Footer />
    </>
  );
};

export default ParentAddStudent;
