import React from "react";
import "./Mentor.scss";
import LogoLineBr from "../../images/LogoLineBreak.png";
import cabbageImg from "../../images/mission-image.png";
import volunteerImg from "../../images/volunteer.png";
import teacher from "../../images/teaching.png";
import makeADifference from "../../images/difference.png";

const Mentor = () => {
  return (
    <div className="board-container">
      <div className="flex-container">
        <div className="text-content">
          <h1>Become a Mentor</h1>
          <p>
            Your time and talent can make a real difference in people's lives.
          </p>
          <button className="apply-button">Apply Now</button>
        </div>
        <div className="image-content">
          <img src={cabbageImg} alt="Cabbage" />
        </div>
      </div>

      <div className="line-break">
        <img src={LogoLineBr} alt="Line Break" />
      </div>

      <div className="mentor-details">
        <img src={makeADifference} alt="Make a Difference" />
      </div>

      <div className="mentor-roles">
        <img src={volunteerImg} alt="Volunteer" />
        <img src={teacher} alt="Teaching and Learning" />
      </div>

      <button className="apply-button">Apply Now</button>
    </div>
  );
};

export default Mentor;
