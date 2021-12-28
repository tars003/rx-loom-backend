const mongoose = require('mongoose');

const ZoneSchema = mongoose.Schema({
    name: String,
    station1: String,       // Station 1 Id
    station2: String,       // Station 2 Id
    employeeId: String,     // Employee Id
    tagId: String,          // Tag Id
});

module.exports = mongoose.model('zone', ZoneSchema);