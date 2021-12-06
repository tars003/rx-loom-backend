const mongoose = require('mongoose');

const EmployeeSchema = mongoose.Schema({
    name: String,
    phone: String,
    tagId: String,
    shiftId: String,
    stationId: String
});

module.exports = mongoose.model("employee", EmployeeSchema);