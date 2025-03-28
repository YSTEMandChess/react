import React, { useState, useEffect } from 'react';
import { setPermissionLevel } from '../../models/globals';
import Chess from '../../models/chess';
//import LessonsService from '../../lessons.service';
import { useCookies } from 'react-cookie';
import './Learnings.css';


const Learnings = () => {
  const [playLink, setPlayLink] = useState('play-nolog');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [logged, setLogged] = useState(false);
  const [chessSrc, setChessSrc] = useState(null);
  const [sections, setSections] = useState([]);
  const [currentFen, setCurrentFen] = useState('');
  const [activeState, setActiveState] = useState({
    name: 'Basic',
    fen: '8/8/8/P7/8/5p2/8/8 w k - 0 1',
    info: `Pawns move one square only. But when they reach the other side of the board, they become a stronger piece!`,
  });
  const [lessonNumber, setLessonNumber] = useState(0);
  const [cookies] = useCookies(['cookie-name']);
  const chess = new Chess('chessBd', true);
  const lessonsService = new LessonsService();

  useEffect(() => {
    const init = async () => {
      const chessURL = process.env.REACT_APP_CHESS_CLIENT_URL;
      setChessSrc(chessURL);

      const initialSection = lessonsService.learningsArray[0].subSections[0];
      setActiveState(initialSection);
      setSections(lessonsService.getLearnings(lessonNumber));

      const uInfo = await setPermissionLevel(cookies);
      if (!uInfo.error) {
        setLogged(true);
        setRole(uInfo.role);
        setUsername(uInfo.username);

        if (uInfo.role === 'student') {
          setPlayLink('student');
        } else if (uInfo.role === 'mentor') {
          setPlayLink('play-mentor');
        }
      }
    };

    init();
  }, [lessonNumber, cookies]);

  const setStateAsActive = (state) => {
    setActiveState(state);
    startLesson(state);
  };

  const startLesson = ({ info, fen }) => {
    setTimeout(() => {
      chess.newGameInit(fen);
      setCurrentFen(fen);
    }, 2000);
  };

  const loadNextLesson = () => {
    setLessonNumber((prev) => prev + 1);
    setSections(lessonsService.getLearnings(lessonNumber + 1));
  };

  const loadPrevLesson = () => {
    setLessonNumber((prev) => prev - 1);
    setSections(lessonsService.getLearnings(lessonNumber - 1));
  };

  const refresh = () => {
    chess.newGameInit(currentFen);
  };

  return (
    <>
      <header>
        {/* Your Header component goes here */}
      </header>
      <div className="container">
        <div className="row lesson-play-section">
          <div className="col-12 col-lg-8 chess">
            <div className="btn-div">
              <button className="lesson-btn">Lesson</button>
              <button className="play-btn">
                <a style={{ color: 'black' }} href={playLink}>Play</a>
              </button>
            </div>
            <iframe id="chessBd" src={chessSrc} title="Chess Board"></iframe>
          </div>
          <div className="col-12 col-lg-4 pl-lg-5">
            <div className="row mt-5 align-items-center">
              <div className="col-8 font-weight-bold">
                <h3>{activeState.name}</h3>
              </div>
              <div className="col-4 text-right">
                <button className="refresh-btn" onClick={refresh}>
                  <i className="fa-sharp fa-solid fa-rotate-right icon-size"></i>
                </button>
              </div>
            </div>
            <div className="row mt-4 mx-1">
              <div className="col-12 lesson-instruction-section">
                <p className="lesson-instruction text-center">Try this!</p>
                <p className="lesson-instruction instruction-detail pl-5">{activeState.info}</p>
              </div>
            </div>
            <div className="row mt-5">
              <div className="col-6 text-right">
                <button className="play-btn" onClick={loadPrevLesson} disabled={lessonNumber === 0}>
                  <i className="fa-solid fa-arrow-left pr-2 icon-size"></i>Back
                </button>
              </div>
              <div className="col-6">
                <button className="next-btn" onClick={loadNextLesson} disabled={lessonNumber === 35}>
                  Next<i className="fa-solid fa-arrow-right pl-2 icon-size"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-5 pt-2">
          <div className="col">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.subSections.map((subSection, subIndex) => (
                  <div className="tab subsection-section" key={subIndex}>
                    <button
                      className={`tablinks btn-tabs col-2 font-weight-bold ${subSection === activeState ? 'active' : ''}`}
                      onClick={() => setStateAsActive(subSection)}
                    >
                      {subSection.name}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <footer>
        {/* Your Footer component goes here */}
      </footer>
    </>
  );
};

export default Learnings;
