import React from "react";
import "./Mentor.scss";
import LogoLineBr from "../../../assets/images/LogoLineBreak.png";
import cabbageImg from "../../../assets/images/mission-image.png";
import volunteerImg from "../../../assets/images/volunteer.png";
import teacher from "../../../assets/images/teaching.png";
import makeADifference from "../../../assets/images/difference.png";

const Mentor = () => {
  return (
    <main className="board-container" role="main">
      <section className="flex-container" role="region" aria-label="Application Section" tabIndex={0}>
        <div className="text-content">
          <h1>Become a Mentor</h1>
          <p>
            Your time and talent can make a real difference in people's lives.
          </p>
          <button className="apply-button" aria-label="Apply Button" tabIndex={0}>Apply Now</button>
        </div>
        <div className="image-content">
          <img src={cabbageImg} alt="Cabbage" />
        </div>
      </section>

      <div className="line-break">
        <img src={LogoLineBr} alt="" role="presentation" />
      </div>

      <section className="mentor-details" role="region">
        <img src={makeADifference} alt="Make a difference by working with schools and underprivileged students." />
      </section>

      <section className="mentor-roles" role="region">
        <img src={volunteerImg} alt="Volunteer" />
        <img src={teacher} alt="Teaching and Learning" />
      </section>

      <button className="apply-button" arial-label="Apply Button" >Apply Now</button>
    </main>
  );
};

export default Mentor;
