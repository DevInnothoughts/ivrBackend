var express = require("express");
var router = express.Router();
const {
  addNote,
  addCallingNote,
  addSurgeryCallingNote,
  addPostOpCallingNote,
  addCallbackDate,
  addPOCallbackDate,
  addEnquiryCallbackDate,
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
      req.query.location,
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
      req.query.location,
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
      req.query.location,
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/addCallbackDate", async (req, res, next) => {
  try {
    const result = await addCallbackDate(
      req.body.id,
      req.body.callbackDate,
      req.query.location,
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/addPOCallbackDate", async (req, res, next) => {
  try {
    const result = await addPOCallbackDate(
      req.body.id,
      req.body.callbackDate,
      req.query.location,
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/addEnquiryCallbackDate", async (req, res, next) => {
  try {
    const result = await addEnquiryCallbackDate(
      req.body.id,
      req.body.callbackDate,
      req.query.location,
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
