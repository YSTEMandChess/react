import mongoose from "mongoose";
const { Schema, Document, model } = mongoose;

export interface Activity {
    name: string;
    type: string;
    completed: boolean;
}
const ActivitySchema = new Schema<Activity>({
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
    },
});

interface ActivitiesDocument extends Document {
    userId: mongoose.Types.ObjectId;
    activities: Activity[];
    completedDates: Date[];
}
const ActivitiesSchema = new Schema<ActivitiesDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    activities: {
        type: [ActivitySchema],
        required: true,
    },
    completedDates: {
        type: [Date],
        required: true
    }
})

module.exports = model<ActivitiesDocument>("activities", ActivitiesSchema);