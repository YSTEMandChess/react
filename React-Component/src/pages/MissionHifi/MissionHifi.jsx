import React, { useEffect } from 'react';
import { useCookies } from 'react-cookie';
import Header from '../../Header/Header';
import Footer from '../../Footer/Footer';
import './MissionHifi.css';

const MissionHifi = () => {
  const [cookies, setCookie, removeCookie] = useCookies(['newGameId']);

  useEffect(() => {
    removeCookie('newGameId');
  }, [removeCookie]);

  return (
    <>
      <Header />
      <div className="mission-hifi-container">
        <div className="board-container">
          <img 
            src="/assets/images/missionHifi/mission-image.png" 
            width="250px"
            height="auto"
            style={{ float: 'right' }}
            alt="Mission"
          />
          <h2 className="sub-heading">Our Mission</h2>
          <p className="word">
            Empower underserved and at-risk children with an opportunity to pursue STEM careers and change their life trajectory.
          </p>
          <h2 className="sub-heading">What We Do</h2>
          <p className="word">
            We teach children chess, math, and computer science to empower them to pursue STEM majors/professions with the support of professionals.
          </p>
        </div> 

        <div className="chess-image">
          <img 
            src="/assets/images/missionHifi/divider.png" 
            alt="Chess Image" 
            className="divider-image" 
          />
          <img 
            src="/assets/images/missionHifi/info 6.png" 
            className="divider-image"
            width="70%"
            height="auto"
            alt="Information"
          />
          <br /><br /><br />
          <img 
            src="/assets/images/missionHifi/Donate.png"
            width="15%"
            height="auto"
            alt="Donate"
          />
        </div>

        <div className="chess-image">
          <img 
            src="/assets/images/missionHifi/Free_Plan.png"
            width="20%"
            height="auto"
            style={{ margin: '5%' }}
            alt="Free Plan"
          />
          <img 
            src="/assets/images/missionHifi/Premium_Plan.png"
            width="20%"
            height="auto"
            style={{ margin: '5%' }}
            alt="Premium Plan"
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MissionHifi;
