var express = require("express");
var router = express.Router();
const { addEnquiry, addHelplineEnquiry } = require("../models/enquiryModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await addEnquiry(req.body);
    console.log("Enquiry:", result);
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

module.exports = router;
