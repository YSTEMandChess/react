import React from 'react';
import "./lesson-content.scss";

const PlayLesson = ({ chessLessonSrc }) => {
    return (
        <div className="cont">
            <div className="row">
                <div className="lichess">
                    <iframe src={chessLessonSrc} id="chessBd" title="Chess Lesson Board"></iframe>
                </div>
                <div className="jitsi" id="local_stream">
                    {/* <iframe src="https://meet.jit.si/" className="jitsi" frameborder="0" style={{ position: 'relative', height: '100%', width: '100%' }} title="Local Stream"></iframe> */}
                </div>
                <div className="jitsi" id="remote_stream">
                    <iframe
                        src="https://meet.jit.si/"
                        className="jitsi"
                        frameBorder="0"
                        style={{ position: 'relative', height: '100%', width: '100%' }}
                        title="Remote Stream"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default PlayLesson;
