import React, { memo } from 'react';

// Component to display a single scenario item.
function ScenarioTemplate({ scenario, onClick, styles }) {
    return (
        <div className={styles.itemTemplate} onClick={onClick}>
            <div>{scenario.name}</div>
        </div>
    );
}

export default memo(ScenarioTemplate);