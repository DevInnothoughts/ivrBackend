var express = require("express");
var router = express.Router();
const {
  addEnquiry,
  addHelplineEnquiry,
  addHelplineSpam,
  addIVRSpam,
  addEnquiryV2,
  addHelplineEnquiryV2,
} = require("../models/enquiryModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await addEnquiry(req.body);
    console.log("Enquiry:", result);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/spam", async (req, res, next) => {
  try {
    const result = await addIVRSpam(req.body);
    console.log("IVR Spam:", result);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/helpline", async (req, res, next) => {
  try {
    const result = await addHelplineEnquiry(req.body);
    console.log("Helpline Enquiry:", result);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/helpline/spam", async (req, res, next) => {
  try {
    const result = await addHelplineSpam(req.body);
    console.log("Helpline Spam:", result);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

// V2 — also saves to hhc_appointments.master_enquiry (source + branch)
router.post("/v2", async (req, res, next) => {
  try {
    const result = await addEnquiryV2(req.body);
    console.log("Enquiry V2:", result);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/helpline/v2", async (req, res, next) => {
  try {
    const result = await addHelplineEnquiryV2(req.body);
    console.log("Helpline Enquiry V2:", result);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
