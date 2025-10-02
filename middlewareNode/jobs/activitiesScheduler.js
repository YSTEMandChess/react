const schedule = require("node-schedule");

// make query to new activiity conversion collection
// _id, activityTitle, activityDescription
// local array, if sceleted activitiy doesnt exist, add to array
const selectActivities = () => {

}

const job = schedule.scheduleJob('0 0 * * *', function () {
    //query all activity documents
    //for each _id, assign new activities
    const activities = selectActivities();
})