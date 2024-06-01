import React from 'react';
import './StudentInventory.scss';
import Images from '../../images/imageImporter'

const StudentInventory = ({ userPortraitSrc, userName }) => {
  return (
    <main id="main-inventory-content">
        <section className="inv-intro">
            <div className="inv-intro-portrait">
                <img className="inv-intro-portrait-face" src={userPortraitSrc} alt="user portrait"></img>
                <img className="inv-intro-portrait-camera" src={Images.userPortraitCamera} alt="user portrait camera icon"></img>
            </div>
            <div className="inv-intro-welcome">
                <h1>Hello, {userName}!</h1>
            </div>
        </section>
        <section className="inv-inventory">
            <div className="inv-inventory-topbar">
                <h2>Your Progress</h2>
            </div>
            <div className="inv-inventory-analytics">
                <div className="inv-inventory-analytics-graph">
                    <img src={Images.lineGraphPlaceholder} alt="progress graph" />
                </div>
                <div className="inv-inventory-analytics-metrics">
                    <h3>Time Spent</h3>
                    <ul>
                        <li>Website: <strong>45 Min</strong></li>
                        <li>Playing: <strong>15 Min</strong></li>
                        <li>Lessons: <strong>10 Min</strong></li>
                        <li>Puzzle: <strong>5 Min</strong></li>
                        <li>Mentoring: <strong>10 Min</strong></li>
                    </ul>
                </div>
            </div>
            <div className="inv-inventory-content-section">
                <nav className="inv-inventory-content-tabs">
                    <ul>
                        <div className="inventory-tab active-tab">
                            <img src={Images.activityIcon} alt="activity icon"></img>
                            <li data-content="activity">Activity</li>
                        </div>
                        <div className="inventory-tab">
                            <img src={Images.mentorIcon} alt="mentor icon"></img>
                            <li data-content="mentor">Mentor Session</li>
                        </div>
                        <div className="inventory-tab">
                            <img src={Images.learningIcon} alt="learning icon"></img>
                            <li data-content="learning">Learning</li>
                        </div>
                        <div className="inventory-tab">
                            <img src={Images.chessLessonsIcon} alt="chess lessons icon"></img>
                            <li data-content="lessons">Chess Lessons</li>
                        </div>
                        <div className="inventory-tab">
                            <img src={Images.gamesIcon} alt="games icon"></img>
                            <li data-content="games">Games</li>
                        </div>
                        <div className="inventory-tab">
                            <img src={Images.puzzlesIcon} alt="puzzles icon"></img>
                            <li data-content="puzzles">Puzzles</li>
                        </div>
                        <div className="inventory-tab">
                            <img src={Images.playComputerIcon} alt="play with computer icon"></img>
                            <li data-content="computer">Play With Computer</li>
                        </div>
                        <div className="inventory-tab">
                            <img src={Images.recordingsIcon} alt="recordings icon"></img>
                            <li data-content="recordings">Recordings</li>
                        </div>
                        <div className="inventory-tab">
                            <img src={Images.backpackIcon} alt="backpack icon"></img>
                            <li data-content="backpack">Backpack Inventory</li>
                        </div>
                    </ul>
                </nav>
                <div className="inv-inventory-content-content">
                    <div id="inventory-content-activity" class="inventory-content active-content">
                        <div className="inventory-content-headingbar">
                            <h2>Activity</h2>
                            <h4>May 2024</h4>
                        </div>
                        <div className="inventory-content-body">
                            <div className="inventory-content-line"></div>
                            <article className="inventory-content-timecard">
                                <div className="inventory-content-col1"></div>
                                <div className="inventory-content-col2">
                                    <p>May 24 2024</p>
                                    <p>7:00 PM</p>
                                </div>
                                <div className="inventory-content-col3">
                                    <p>Solved 2 tactical puzzles.</p>
                                </div>
                            </article>
                            <article className="inventory-content-timecard">
                                <div className="inventory-content-col1"></div>
                                <div className="inventory-content-col2">
                                    <p>May 19 2024</p>
                                    <p>3:00 PM</p>
                                </div>
                                <div className="inventory-content-col3">
                                    <p>Practiced 7 positions on Piece Checkmates I.</p>
                                </div>
                            </article>
                            <article className="inventory-content-timecard">
                                <div className="inventory-content-col1"></div>
                                <div className="inventory-content-col2">
                                    <p>May 16 2024</p>
                                    <p>4:00 PM</p>
                                </div>
                                <div className="inventory-content-col3">
                                    <p>Completed 100 games of chess.</p>
                                </div>
                            </article>
                        </div>
                    </div>
                    <div id="inventory-content-mentor" class="inventory-content">
                        <h2>Content 2</h2>
                        <p>This is the content for Tab 2.</p>
                    </div>
                    <div id="inventory-content-learning" class="inventory-content">
                        <h2>Content 3</h2>
                        <p>This is the content for Tab 3.</p>
                    </div>
                    <div id="inventory-content-lessons" class="inventory-content">
                        <h2>Content 4</h2>
                        <p>This is the content for Tab 4.</p>
                    </div>
                    <div id="inventory-content-games" class="inventory-content">
                        <h2>Content 4</h2>
                        <p>This is the content for Tab 4.</p>
                    </div>
                    <div id="inventory-content-puzzles" class="inventory-content">
                        <h2>Content 4</h2>
                        <p>This is the content for Tab 4.</p>
                    </div>
                    <div id="inventory-content-computer" class="inventory-content">
                        <h2>Content 4</h2>
                        <p>This is the content for Tab 4.</p>
                    </div>
                    <div id="inventory-content-recordings" class="inventory-content">
                        <h2>Content 4</h2>
                        <p>This is the content for Tab 4.</p>
                    </div>
                    <div id="inventory-content-backpack" class="inventory-content">
                        <h2>Content 4</h2>
                        <p>This is the content for Tab 4.</p>
                    </div>
                </div>
            </div>
        </section>
        <section className="inv-streaks">
            <h2>Welcome to Your Streak Progress Page!</h2>
            <div>
                <h3>Streak Clock</h3>
                <img src="" alt="streak clock graphic" />
            </div>
            <div>
                <h3>Weekly Progress</h3>
                <img src="" alt="weekly progress graphic" />
            </div>
            <div>
                <h3>Calendar</h3>
                <img src="" alt="calendar graphic" />
            </div>
        </section>
        <section className="inv-growth-quest">

        </section>
        <section className="inv-badges">

        </section>
        <section className="inv-leaderboard">

        </section>
    </main>
  );
};

export default StudentInventory;