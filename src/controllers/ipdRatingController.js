var express = require("express");
const { getIPDBillsV2, updateRatings } = require("../models/ipdRatingModel");
var router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const leads = await getLeads(req.query.location);
    res.status(200).send(leads);
  } catch (err) {
    next(err);
  }
});

router.post("/updateRating", async (req, res, next) => {
  try {
    //console.log("Update Ratings Body:", req.body);
    const leads = await updateRatings(req);
    res.status(200).send(leads);
  } catch (err) {
    next(err);
  }
});

router.get("/billsV2", async (req, res, next) => {
  console.log(req.query.location);
  console.log(req.query.from);
  console.log(req.query.to);
  try {
    const IPDBills = await getIPDBillsV2(req);
    console.log(IPDBills);
    res.status(200).send(IPDBills);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
