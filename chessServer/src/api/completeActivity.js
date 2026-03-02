/**
 * Helper function to send API requests to complete activities
 * @param {username} - Username for student whose activity is completed
 * @param {credentials} - User's cookie
 * @param {activityName} - Name of the activity being completed
 * 
 * activityTypes collection contains list of activities
 */
module.exports = completeActivity = async (username, credentials, activityName) => {
    const response = await fetch(`${process.env.MIDDLEWARE_URL}/activities/${username}/activity`, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
            'Authentication' : `Bearer ${credentials}`,
        },
        body: JSON.stringify({
            activityName: activityName,
        })
    });
    if(!response.ok) {
        throw Error('Could not submit completed activity to database');
    }
    return response;
}