var express = require("express");
var router = express.Router();
const { addAppointment } = require("../models/appointmentModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await addAppointment(req.body);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
