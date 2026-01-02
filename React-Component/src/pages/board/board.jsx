import React from 'react';
import './board.css';

const Board = () => {
    return (
        <div>
            <h1 className="board-heading">Board</h1>
            <div className="chess-image">
                <img src="/assets/images/financials/divider.png" alt="Chess Image" className="divider-image" />
            </div>
            <div className="board-container">
                <h2 className="sub-heading">Officers</h2>
                <ul>
                    <li>
                        <span className="name bold-name">Devin Nakano</span><br />
                        <span className="role">Founder, President and Executive Director</span>
                    </li>
                    <li>
                        <span className="name bold-name">Jasmine Redlich</span><br />
                        <span className="role">Vice President</span>
                    </li>
                    <li>
                        <span className="name bold-name">Owen Oertell</span><br />
                        <span className="role">Secretary</span>
                    </li>
                    <li>
                        <span className="name bold-name">Kelsey Korvela</span><br />
                        <span className="role">Treasurer</span>
                    </li>
                </ul>

                <br />
                <h2 className="sub-heading">Board Members</h2>
                <ul>
                    <li>
                        <span className="name bold-name">Amit Jain, PhD</span><br />
                        <span className="role">Chair of the Computer Science, Boise State University</span>
                    </li>
                    <li>
                        <span className="name bold-name">Sasikanth R.</span><br />
                        <span className="role">International Board Member and Entrepreneur</span>
                    </li>
                    <li>
                        <span className="name bold-name">Holly Trainer</span><br />
                        <span className="role">Retired Public School Teacher</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Board;
