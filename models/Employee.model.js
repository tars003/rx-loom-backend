const mongoose = require('mongoose');

const EmployeeSchema = mongoose.Schema({
    name: String,
    phone: String,
    tagId: String,
    points: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("employee", EmployeeSchema);