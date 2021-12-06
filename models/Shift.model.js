const mongoose = require('mongoose');

const ShiftSchema = mongoose.Schema({
    name: String,
    startTime: String,
    endTime: String,
    employees: [{
      _id : String,
      name: String,
      stationId: String,
    },]
});

module.exports = mongoose.model("shift", ShiftSchema);