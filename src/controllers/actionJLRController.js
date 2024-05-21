var express = require("express");
var router = express.Router();
const { addAction, getRecords } = require("../models/actionJLRModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await addAction(req.body);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const records = await getRecords();
    //console.log(records);
    res.status(200).send(records);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
