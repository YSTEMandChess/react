/**
 * Sends a PUT request to the middleware to mark an activity as complete.
 * @param {string} username - The student's username
 * @param {string} credentials - The student's auth token (JWT)
 * @param {string} activityName - The activity identifier (e.g. 'captureQueen')
 * @returns {Response} The fetch response
 */
const completeActivity = async (username, credentials, activityName) => {
    const url = `${process.env.MIDDLEWARE_URL}/activities/${username}/activity`;
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${credentials}`,
        },
        body: JSON.stringify({ activityName }),
    });
    return response;
};

module.exports = { completeActivity };
