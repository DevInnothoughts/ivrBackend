var express = require("express");
var router = express.Router();
const { getFDEs } = require("../models/fdeModel");

router.get("/", async (req, res, next) => {
  try {
    const fdes = await getFDEs(req.query.location);
    res.status(200).send(fdes);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
