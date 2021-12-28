const { Router } = require('express');

const Zone = require('../models/Zone.model');
const Station = require('../models/Station.model');
const RunningShift = require('../models/RunningShift.model');
const Shift = require('../models/Shift.model');
const Employee = require('../models/Employee.model');
const req = require('express/lib/request');

const router =  Router();

router.post('/create', async(req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));

        const {
            name,
            machine1,
            machine2
        } = obj;

        const stationExists = await Station.findOne({name: name});

        if(stationExists) 
            return res.status(400).json({
                success: false,
                message: `A station with name : ${name} already exists!`
            });

        const station = await Station.create({
            name,
            machine1,
            machine2
        });

        return res.status(200).json({
            success: true,
            data: station
        })


    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/get-all', async (req, res) => {
    try {
        const stations = await Station.find();

        return res.status(200).json({
            success: true,
            count: stations.length,
            data: stations
        })

    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            message: 'Server error'
        });
    }
})

router.get('/delete/:id', async(req, res) => {
    try {
        const stationExists = await Station.findById(req.params.id);

        if(!stationExists) 
            return res.status(400).json({
                success: false,
                message: `No station found with id : ${req.params.id}!`
            });

        await stationExists.remove();

        return res.status(200).json({
            success: true,
            message: 'Station removed !'
        })


    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;