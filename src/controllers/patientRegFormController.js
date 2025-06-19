var express = require("express");
var router = express.Router();
const {
  verifyPatient,
  addPatientRegForm,
} = require("../models/patientRegFormModel");

router.post("/", async (req, res, next) => {
  try {
    // Add basic validation
    if (!req.body.patient_id) {
      return res.status(400).json({ error: "Patient ID is required" });
    }

    const result = await addPatientRegForm(req.body);

    // Send a more informative response
    res.status(200).json({
      success: true,
      message: "Patient record updated successfully",
      affectedRows: result.affectedRows,
      patient_id: req.body.patient_id,
    });
  } catch (err) {
    // Log the error for server-side debugging
    console.error("Patient registration error:", err);

    // Send appropriate status code based on error
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message || "Failed to update patient record",
    });
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const result = await verifyPatient(req.body);

    // Send response based on the returned status
    res.status(result.status || 200).send(result);
  } catch (err) {
    // Only catches actual exceptions like DB errors
    next(err);
  }
});

module.exports = router;
