var express = require("express");
var router = express.Router();
const { addEnquiry } = require("../models/enquiryModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await addEnquiry(req.body);
    console.log("Enquiry:", result);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
