var express = require("express");
var router = express.Router();
const {
  addHelplineAppointment,
  addAppointmentV1,
  addAppointmentV2,
  addHelplineAppointmentV2,
} = require("../models/appointmentModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await addAppointmentV1(req.body);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/helpline", async (req, res, next) => {
  try {
    const result = await addHelplineAppointment(req.body);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

// V2 — also saves to hhc_appointments.master_enquiry (source + branch)
router.post("/v2", async (req, res, next) => {
  try {
    const result = await addAppointmentV2(req.body);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/helpline/v2", async (req, res, next) => {
  try {
    const result = await addHelplineAppointmentV2(req.body);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
