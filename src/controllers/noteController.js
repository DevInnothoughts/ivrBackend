var express = require("express");
var router = express.Router();
const { addNote } = require("../models/noteModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await addNote(req.body);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
