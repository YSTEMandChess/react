import React from 'react';
import "./lesson-content.scss";

const PlayLesson = ({ chessLessonSrc }: any) => {
    return (
        <div className="cont">
            <div className="row">
                <div className="lichess">
                    <iframe src={chessLessonSrc} id="chessBd" title="Chess Lesson Board"></iframe>
                </div>
            </div>
        </div>
    );
};

export default PlayLesson;
