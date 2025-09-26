const mongoose = require("mongoose");
const { Schema, model } = mongoose;
import { ObjectId } from "mongodb";

const activitySchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true,
    },
    activities: {
        type: Array<Activity>,
        required: true,
    },
    completedDates: {
        type: Array<Date>,
        required: true
    }
})

type Activity = {
    name: string,
    type: string,
    completed: boolean
}