var express = require("express");
var router = express.Router();
const { addAction } = require("../models/actionJLRModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await addAction(req.body);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
