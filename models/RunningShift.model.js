const mongoose = require('mongoose');

const Runningshift = mongoose.Schema({
    shiftId: mongoose.Schema.Types.ObjectId,
    date: String,
    employees: [
        {
            _id: String,          // emp id
            name: String,
            zoneName: String,
            activeTime: Number,
            awayTime: Number,
            idealTime: Number,
            reportedTime: String,
            status: Boolean,
            lastRSSI: Number,
            points: Number
        }
    ]
});

module.exports = mongoose.model("runningShift", Runningshift);