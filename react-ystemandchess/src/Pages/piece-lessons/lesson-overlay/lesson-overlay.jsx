import "./lesson-overlay.scss";
import "./lesson-content.jsx";

const LessonOverlay = () => {
    return (
        <>
            <body>
                <div id="lesson-container">
                    <div id="top">
                        <h1>Lesson Number {{displayLessonNum}}</h1>
                    </div>
                    <div id="chess-board">
                        <app-play-lesson></app-play-lesson>
                    </div>
                    <div id="bottom">
                        <button type="button" id="previous" onClick={previousLesson}>
                            Previous &lt;
                        </button>
                        <button type="button" id="next" onClick={nextLesson}>
                            Next &gt;
                        </button>
                    </div>
                </div>
            </body>
        </>
    );
};

export default LessonOverlay;
