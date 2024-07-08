import React from 'react';
import "./lesson-content.scss";

const LessonContent = ({ chessLessonSrc }) => {
    return (
        <div className="cont">
            <div className="row">
                <div className="lichess">
                    <iframe src={chessLessonSrc} id="chessBd"></iframe>
                </div>
                <div className="jitsi" id="local_stream">
                    {/* <iframe src="https://meet.jit.si/" className="jitsi" frameborder="0" style={{ position: 'relative', height: '100%', width: '100%' }}></iframe> */}
                </div>
                <div className="jitsi" id="remote_stream">
                    <iframe
                        src="https://meet.jit.si/"
                        className="jitsi"
                        frameBorder="0"
                        style={{ position: 'relative', height: '100%', width: '100%' }}
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default LessonContent;
