var express = require("express");
var router = express.Router();
const { getDoctors } = require("../models/doctorModel");

router.get("/", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const doctors = await getDoctors(req.query.location);
    res.status(200).send(doctors);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
