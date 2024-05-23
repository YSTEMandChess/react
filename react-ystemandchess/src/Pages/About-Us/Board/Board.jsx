import React from 'react';
import './Board.scss';
import LogoLineBr from '../../../images/LogoLineBreak.png';

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
              <name className="name">Devin Nakano</name><br />
              Founder, President and Executive Director
            </li>
            <li>
              <name className="name">Jasmine Redlich</name><br />
              Vice President
            </li>
            <li>
              <name className="name">Owen Oertell</name><br />
              Secretary
            </li>
            <li>
              <name className="name">Kelsey Korvela</name><br />
              Treasurer
            </li>
          </ul>
        </div>
        <div className="board-section">
          <h2>Board Members</h2>
          <ul>
            <li>
              <name className="name">Amit Jain, Phd</name><br />
              Chair of the Computer Science Boise State University
            </li>
            <li>
              <name className="name">Sasikanth R.</name><br />
              International Board Member and Entrepreneur
            </li>
            <li>
              <name className="name">Holly Trainer</name><br />
              Retired Public School teacher
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Board;
