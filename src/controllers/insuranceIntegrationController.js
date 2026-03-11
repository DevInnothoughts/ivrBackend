const express = require("express");

const router = express.Router();
const {
  searchPatient,
  savePatientStatusUpdate,
  searchPatientProd,
  savePatientStatusUpdateProd,
} = require("../models/insuranceIntegrationModel");

// Middleware to check AccessToken
router.use((req, res, next) => {
  const accessToken = req.headers["accesstoken"];
  if (
    !accessToken ||
    accessToken !== "76B3D4C3FEBA76666AB48416643B7B511AFDB70929A499"
  ) {
    return res.status(400).json({
      isSuccess: false,
      errorCode: "E101",
      errorMessage: "AccessToken does not exist or invalid in the API header",
      // identifier: uuidv4(),
      response: null,
    });
  }
  next();
});

function safeDateToMillis(dateVal) {
  if (!dateVal) return null;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return d.getTime().toString();
  } catch {
    return null;
  }
}

function calculateAgeFromDOB(dobStr) {
  if (!dobStr) return null;

  const parts = dobStr.split("-");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // month is 0-indexed
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const today = new Date();
  let age = today.getFullYear() - year;

  // Adjust if birthday hasn’t occurred yet this year
  const hasBirthdayPassed =
    today.getMonth() > month ||
    (today.getMonth() === month && today.getDate() >= day);

  if (!hasBirthdayPassed) {
    age--;
  }

  return age;
}

function convertToEpochIST(dateStr) {
  //console.log("Converting date string to epoch IST:", dateStr);
  if (!dateStr) return null;

  const parts = dateStr.split("-");
  let day, month, year;

  if (parts[0].length === 4) {
    // Format: YYYY-MM-DD
    [year, month, day] = parts.map(Number);
  } else {
    // Format: DD-MM-YYYY
    [day, month, year] = parts.map(Number);
  }

  // ✅ Manually create UTC date and shift to IST
  const utcDate = new Date(Date.UTC(year, month - 1, day)); // months are 0-based
  const istOffsetMs = 5.5 * 60 * 60 * 1000; // IST offset (5 hours 30 minutes)
  const istDate = new Date(utcDate.getTime() + istOffsetMs);

  //console.log("Parsed IST date:", istDate);

  return `${Math.floor(istDate.getTime() / 1000)}`; // epoch seconds
}

router.post("/v1/PatientSearch", async (req, res) => {
  try {
    const { providerID } = req.body;
    const uhid = (req.body.uhid || "").trim();
    const mobileNumber = (req.body.mobileNumber || "").trim();

    // console.log("Received PatientSearch request:", {
    //   providerID,
    //   uhid,
    //   mobileNumber,
    // });

    // ✅ Validate before any DB calls
    if (!providerID || (uhid === "" && mobileNumber === "")) {
      //console.log("Invalid request parameters");
      return res.status(400).json({
        isSuccess: false,
        errorCode: "E102",
        errorMessage: "No key to search",
        response: null,
      });
    }

    // ✅ Only runs if valid
    const patientData = await searchPatient(providerID, uhid, mobileNumber);
    //console.log("Patient Data:", patientData);

    if (!patientData || patientData.length === 0) {
      return res.status(404).json({
        isSuccess: false,
        errorCode: "E103",
        errorMessage: "No matching patient record found",
        response: null,
      });
    }

    const patient = patientData[0];

    return res.status(200).json({
      isSuccess: true,
      errorMessage: null,
      response: {
        hospitalId: `${providerID}`,
        patientDetails: {
          patientName: patient.name || null,
          mobileNumber: patient.phone || null,
          insurerName: patient.InsurerName || null,
          payerName: patient.PayerName || null,
          payerId: `${patient.payerId}` || null,
          insurerId: `${patient.insurerId}` || null,
          uhid: patient.uhid,
          ipNumber: patient.ipNumber,
          patientAge: calculateAgeFromDOB(patient.birth_date),
          patientGender: patient.sex || null,
          dateOfBirth: convertToEpochIST(patient.birth_date),
        },
        treatmentDetails: {
          dateOfAdmission: safeDateToMillis(patient.DateOfAdmission),
          dateOfDischarge: safeDateToMillis(patient.DateOfDischarge),
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      isSuccess: false,
      errorCode: "E500",
      errorMessage: "Internal Error",
      response: null,
    });
  }
});

// Callback API - Patient Status Update
router.post("/v1/patientStatusUpdate", async (req, res) => {
  const {
    hospitalID,
    uhid,
    ipNumber,
    mobileNumber,
    statusId,
    claimNumber,
    statusName,
    claimedAmount,
    approvedAmount,
    settledAmount,
    utrNo,
    remarks,
  } = req.body;

  // hospitalID is required
  if (!hospitalID) {
    return res.status(400).json({
      isSuccess: false,
      errorMessage: "hospitalID is required",
      response: null,
    });
  }

  // At least one patient identifier is required
  if (!uhid && !ipNumber && !mobileNumber) {
    return res.status(400).json({
      isSuccess: false,
      errorMessage: "At least one patient identifier is required",
      response: null,
    });
  }

  try {
    // Save/Update into DB
    await savePatientStatusUpdate({
      hospitalID,
      uhid,
      ipNumber,
      mobileNumber,
      statusId,
      claimNumber,
      statusName,
      claimedAmount,
      approvedAmount,
      settledAmount,
      utrNo,
      remarks,
    });

    // Response according to screenshot
    res.status(200).json({
      isSuccess: true,
      errorMessage: null,
      response: {
        hospitalID,
        uhid: uhid || null,
        ipNumber: ipNumber || null,
        mobileNumber: mobileNumber || null,
        statusName: "Success",
        statusId: "200",
        message: "Saved Successfully",
      },
    });
  } catch (err) {
    console.error("Error in patientStatusUpdate:", err);
    res.status(500).json({
      isSuccess: false,
      errorMessage: "Internal Error",
      response: {
        hospitalID,
        uhid: uhid || null,
        ipNumber: ipNumber || null,
        mobileNumber: mobileNumber || null,
        statusName: "Failure",
        statusId: "500",
        message: "Internal Error",
      },
    });
  }
});

module.exports = router;

//Sample Request
// POST https://<HospitalIntegrationSystem>:4040/ivr/insurance/v1/PatientSearch
// Headers:
//   accesstoken: <YourAccessToken>

// Body (JSON):
// {
//   "providerID": "HOSP12345",
//   "uhid": "UHID987654321",
//   "mobileNumber": "9876543210"
// }

//CallBack API
//Body: {
//   "hospitalID": 102,
//   "uhid": "UH1234",
//   "statusID": "ST01",
//   "statusName": "Approved",
//   "claimedAmount": 5000,
//   "approvedAmount": 4500,
//   "remarks": "Partially Approved"
// }

//Response: {
//   "hospitalID": 102,
//   "uhid": "UH1234",
//   "ipNumber": null,
//   "mobileNumber": null,
//   "statusName": "Approved",
//   "statusID": "ST01",
//   "message": "Saved Successfully"
// }
