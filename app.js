var express = require("express");
var app = express();
const cors = require("cors");
const doctorController = require("./src/controllers/doctorController");
const fdeController = require("./src/controllers/fdeController");
const enquiryController = require("./src/controllers/enquiryController");
const appointmentController = require("./src/controllers/appointmentController");
const appointmentSlotController = require("./src/controllers/appointmentSlotController");
const noteController = require("./src/controllers/noteController");
const actionJLRController = require("./src/controllers/actionJLRController");
const patientController = require("./src/controllers/patientController");
const uploadCallLogsController = require("./src/controllers/uploadCallLogsController");
const callingListController = require("./src/controllers/CallingListController");
const patientRegFormController = require("./src/controllers/patientRegFormController");
const leadManagementController = require("./src/controllers/leadManagementController");
const ipdRatingController = require("./src/controllers/ipdRatingController");
const insuranceController = require("./src/controllers/insuranceIntegrationController");
const insuranceProdController = require("./src/controllers/insuranceProdIntegrationController");
const pharmacyController = require("./src/controllers/pharmacyIntegrationController");
const masterEnquiryController = require("./src/controllers/masterEnquiryController");
const patientMasterController = require("./src/controllers/patientMasterController");
const dashboardAuthController = require("./src/controllers/dashboardAuthController");

app.use(express.json());
app.use(cors());

// Routes
app.use("/ivr/doctor", doctorController);
app.use("/ivr/fde", fdeController);
app.use("/ivr/patient", patientController);
app.use("/ivr/enquiry", enquiryController);
app.use("/ivr/appointment", appointmentController);
app.use("/ivr/appointment", appointmentSlotController); // new slot routes only (/slots, /slot-booking, /helpline/slot-booking)
app.use("/ivr/addNote", noteController);
app.use("/ivr/actionJLR", actionJLRController);
app.use("/ivr/uploadCallLogs", uploadCallLogsController);
app.use("/ivr/callingList", callingListController);
app.use("/ivr/patientRegForm", patientRegFormController);
app.use("/ivr/leadManagement", leadManagementController);
app.use("/ivr/ipdRating", ipdRatingController);

app.use("/ivr/prod/insurance", insuranceProdController);
app.use("/ivr/insurance", insuranceController);
app.use("/ivr/pharmacy", pharmacyController);
app.use("/ivr/masterEnquiry", masterEnquiryController);
app.use("/ivr/patientMaster", patientMasterController);
app.use("/ivr/dashboardAuth", dashboardAuthController);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).send(err.message || "Something went wrong!");
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
