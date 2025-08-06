import React, { memo } from 'react';

// Component to display a single lesson item within a scenario.
function LessonTemplate({ lesson, onClick, styles }) {
    return (
        <div className={styles.itemTemplate} onClick={onClick}>
            <div>{lesson.name}</div>
        </div>
    );
}

export default memo(LessonTemplate);