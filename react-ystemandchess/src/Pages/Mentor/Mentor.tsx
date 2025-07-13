import React from "react";
import "./Mentor.scss";
import LogoLineBr from "../../images/LogoLineBreak.png";
import cabbageImg from "../../images/mission-image.png";
import makeADifference from "../../images/difference.png";

const Mentor = () => {
  return (
    <main className="mentor-container">
      <section className="hero-section">
        <div className="hero-text">
          <h1>Become a Mentor</h1>
          <p>Your time and talent can make a real difference in people's lives.</p>
          <button className="apply-button">Apply Now</button>
        </div>
        <div className="hero-image">
          <img src={cabbageImg} alt="Mentor making a difference" />
        </div>
      </section>

      <div className="line-break">
        <img src={LogoLineBr} alt="Line Break" />
      </div>

      <section className="mentor-details">
        <img src={makeADifference} alt="Make a Difference" />
      </section>

      <section className="mentor-roles">
        <div className="mentor-card green-card">
          <div className="icon-container transform-icon">
            <span role="img" aria-label="Volunteer">🤝</span>
          </div>
          <h3>Volunteer</h3>
          <p>
            Volunteering is a great way to help teach young people valuable life
            lessons and learn something about yourself in return.
          </p>
        </div>
        <div className="mentor-card white-card">
          <div className="icon-container breathe-icon">
            <span role="img" aria-label="Teaching">🎓</span>
          </div>
          <h3>Teaching and Learning</h3>
          <p>
            Since Mastery Learning provides each student with a unique learning
            experience, we need YOU to help.
          </p>
        </div>
      </section>

      <div className="apply-wrapper">
        <button className="apply-button">Apply Now</button>
      </div>
    </main>
  );
};

export default Mentor;
