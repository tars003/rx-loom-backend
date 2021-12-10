const mongoose = require('mongoose');

const StationSchema = mongoose.Schema({
    name: String,
    machine1: String,
    machine2: String,
});

module.exports = mongoose.model("station", StationSchema);