import React, { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import Header from '../../Header/Header';
import Footer from '../../Footer/Footer';
import './parent.css';

const Parent = () => {
  const [username, setUsername] = useState('');
  const [students, setStudents] = useState([]);
  const [times, setTimes] = useState([]);
  const [cookies, setCookie] = useCookies(['login']);

  useEffect(() => {
    getUsername();
    getStudents();
  }, []);

  const getStudents = () => {
    const url = `${process.env.REACT_APP_MIDDLEWARE_URL}/user/children`;
    fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cookies.login}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const studentNames = data.map((student) => student.username);
        const timePlayed = data.map((student) => student.timePlayed);
        setStudents(studentNames);
        setTimes(timePlayed);
      });
  };

  const getStudentInfo = (index) => {
    setCookie('student', students[index]);
  };

  const getUsername = async () => {
    const userInfo = await setPermissionLevel(cookies);
    if (!userInfo.error) {
      setUsername(userInfo.username);
    }
  };

  return (
    <>
      <Header />
      <div className="container">
        <div className="row">
          <div className="col-8 pad">
            <h2>Welcome {username}</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. In
              aliquam sem fringilla ut. Eget mi proin sed libero enim sed faucibus
              turpis.
            </p>
            <div className="benefits">Benefits</div>
          </div>
        </div>
      </div>
      {students.map((student, i) => (
        <div className="container cont" key={i}>
          <div className="row prog">{student} Progress</div>
          <div className="row">
            <div className="col-sm">
              <h2>Hours Played</h2>
              <h1>{times[i]} Minutes</h1>
            </div>
            <div className="col-sm">
              <h2>Progress</h2>
            </div>
            <div className="col-sm nobac">
              <div className="recordsLink">Recorded Games</div>
              <div className="recordsLink">
                <a onClick={() => getStudentInfo(i)} href="/student-recording">
                  Recorded Lessons
                </a>
              </div>
              <div className="recordsLink">Messages</div>
            </div>
          </div>
        </div>
      ))}
      <div className="container faqs">
        <h2>FAQs</h2>
        <div className="faq">
          <h3>Q: This is a question?</h3>
          <p>This is the answer to the question</p>
        </div>
        <div className="faq">
          <h3>Q: This is a question?</h3>
          <p>This is the answer to the question</p>
        </div>
        <div className="faq">
          <h3>Q: This is a question?</h3>
          <p>This is the answer to the question</p>
        </div>
        <div className="faq">
          <h3>Q: This is a question?</h3>
          <p>This is the answer to the question</p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Parent;
