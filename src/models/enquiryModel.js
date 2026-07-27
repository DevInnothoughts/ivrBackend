const { getConnectionByLocation } = require("../../databaseUtils");
const { addNote, addHelplineNote } = require("./noteModel");

async function addEnquiry(appointments) {
  console.log("Adding enquiry for appointments:", appointments[0]);
  const { connection, location } = getConnectionByLocation(
    appointments[0].patient_location,
  );
  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  const values = appointments.map((appointment) => [
    appointment.patient_type,
    appointment.enquirytype,
    appointment.patient_name,
    appointment.patient_phone.replace(/^(\+91|91|0)+/, ""), // Remove starting "0",
    appointment.date,
    appointment.time,
    location,
    appointment.reference,
    appointment.FDE_Name,
    appointment.note,
  ]);

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        tempCon.release();
        return reject(err);
      }

      var sql =
        "INSERT INTO appointment_enquiry (patient_type, enquirytype, patient_name, patient_phone, date, time, patient_location, reference, FDE_Name, note) VALUES ?";
      tempCon.query(sql, [values], async function (error, result) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        try {
          // Await the addNote function
          await addNote(appointments);
          resolve("Enquiry and note added!");
        } catch (noteError) {
          console.error("Failed to add note:", noteError);
          // Decide how to handle the note error
          resolve("Enquiry added, but failed to add note!");
        }

        // addNote(appointments);
        // resolve("Enquiry added!");
      });
    });
  });
}

async function addHelplineEnquiry(appointments) {
  const { connection, location } = getConnectionByLocation(
    appointments[0].patient_location,
  );
  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  const values = appointments.map((appointment) => [
    appointment.patient_type,
    appointment.enquirytype,
    appointment.patient_name,
    appointment.patient_phone.replace(/^0+/, ""), // Remove starting "0",
    appointment.date,
    appointment.time,
    location,
    appointment.reference,
    appointment.FDE_Name,
    appointment.note,
  ]);

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        tempCon.release();
        return reject(err);
      }

      var sql =
        "INSERT INTO appointment_enquiry (patient_type, enquirytype, patient_name, patient_phone, date, time, patient_location, reference, FDE_Name, note) VALUES ?";
      tempCon.query(sql, [values], async function (error, result) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        try {
          // Await the addNote function
          await addHelplineNote(appointments);
          resolve("Helpline Enquiry and note added!");
        } catch (noteError) {
          console.error("Failed to add Helpline note:", noteError);
          // Decide how to handle the note error
          resolve("Helpline Enquiry added, but failed to add note!");
        }

        // addNote(appointments);
        // resolve("Enquiry added!");
      });
    });
  });
}

async function addHelplineSpam(appointments) {
  const { connection, location } = getConnectionByLocation(
    appointments[0].patient_location,
  );
  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  const values = appointments.map((appointment) => [
    appointment.patient_type,
    appointment.enquirytype,
    appointment.patient_name,
    appointment.patient_phone.replace(/^0+/, ""), // Remove starting "0",
    appointment.date,
    appointment.time,
    location,
    appointment.reference,
    appointment.FDE_Name,
    appointment.note,
  ]);

  try {
    // Await the addNote function
    await addHelplineNote(appointments);
    return "Helpline Enquiry and note added!";
  } catch (noteError) {
    console.error("Failed to add Helpline note:", noteError);
    // Decide how to handle the note error
    return "Helpline Enquiry added, but failed to add note!";
  }
}

async function addIVRSpam(appointments) {
  console.log("Adding IVR spam for appointments:", appointments[0]);
  const { connection, location } = getConnectionByLocation(
    appointments[0].patient_location,
  );

  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  const values = appointments.map((appointment) => [
    appointment.patient_type,
    appointment.enquirytype,
    appointment.patient_name,
    appointment.patient_phone.replace(/^(\+91|91|0)+/, ""), // Remove starting "0",
    appointment.date,
    appointment.time,
    location,
    appointment.reference,
    appointment.FDE_Name,
    appointment.note,
  ]);

  try {
    // Await the addNote function
    await addNote(appointments);
    return "Enquiry and note added!";
  } catch (noteError) {
    console.error("Failed to add note:", noteError);
    // Decide how to handle the note error
    return "Enquiry added, but failed to add note!";
  }
}

module.exports = {
  addEnquiry,
  addHelplineEnquiry,
  addHelplineSpam,
  addIVRSpam,
};
