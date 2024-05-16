var express = require("express");
var app = express();
const cors = require("cors");
const doctorController = require("./src/controllers/doctorController");
const fdeController = require("./src/controllers/fdeController");
const enquiryController = require("./src/controllers/enquiryController");
const appointmentController = require("./src/controllers/appointmentController");
const noteController = require("./src/controllers/noteController");
const actionJLRController = require("./src/controllers/actionJLRController");

app.use(express.json());
app.use(cors());

// Routes
app.use("/ivr/doctor", doctorController);
app.use("/ivr/fde", fdeController);
app.use("/ivr/enquiry", enquiryController);
app.use("/ivr/appointment", appointmentController);
app.use("/ivr/addNote", noteController);
app.use("/ivr/actionJLR", actionJLRController);

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
