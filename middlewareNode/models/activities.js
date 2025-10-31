const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const ActivitiesSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    activities: {
        type: [{
            name: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true,
            },
            completed: {
                type: Boolean,
                required: true,
            }
        }],
        required: true,
    },
    completedDates: {
        type: [Date],
        required: true
    }
})

module.exports = model("activities", ActivitiesSchema);