var express = require("express");
var router = express.Router();
const {
  addNote,
  addCallingNote,
  addSurgeryCallingNote,
  addPostOpCallingNote,
} = require("../models/noteModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await addNote(req.body);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/callingNotes", async (req, res, next) => {
  try {
    const result = await addCallingNote(
      req.body.note,
      req.body.date,
      req.body.enquiryId,
      req.query.location
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/surgeryCallingNotes", async (req, res, next) => {
  try {
    const result = await addSurgeryCallingNote(
      req.body.note,
      req.body.date,
      req.body.id,
      req.query.location
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/postOpCallingNotes", async (req, res, next) => {
  try {
    const result = await addPostOpCallingNote(
      req.body.note,
      req.body.date,
      req.body.id,
      req.query.location
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
