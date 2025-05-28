import React from "react";
import "./Board.scss";
import LogoLineBr from "../../../images/LogoLineBreak.png";

const Board = () => {
  return (
    <div className="board-container">
      <h1>Board</h1>
      <div className="line-break">
        <img src={LogoLineBr} alt="Line Break" />
      </div>
      <div className="board-content">
        <div className="board-section">
          <h2>Officers</h2>
          <ul>
            <li>
              <span className="name">Devin Nakano</span>
              <br />
              Founder, President and Executive Director
            </li>
            <li>
              <span className="name">Jasmine Redlich</span>
              <br />
              Vice President
            </li>
            <li>
              <span className="name">Owen Oertell</span>
              <br />
              Secretary
            </li>
            <li>
              <span className="name">Kelsey Korvela</span>
              <br />
              Treasurer
            </li>
          </ul>
        </div>
        <div className="board-section">
          <h2>Board Members</h2>
          <ul>
            <li>
              <span className="name">Amit Jain, Phd</span>
              <br />
              Chair of the Computer Science Boise State University
            </li>
            <li>
              <span className="name">Sasikanth R.</span>
              <br />
              International Board Member and Entrepreneur
            </li>
            <li>
              <span className="name">Holly Trainer</span>
              <br />
              Retired Public School teacher
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Board;
