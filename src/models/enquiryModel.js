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

// =====================================================================
// V2 — same as addEnquiry / addHelplineEnquiry, plus a copy of each
// enquiry in hhc_appointments.master_enquiry with source + branch name.
// =====================================================================

const {
  SOURCES,
  resolveSource,
  saveEnquiriesToMaster,
} = require("./masterEnquiryModel");

// Insert into the branch appointment_enquiry table and return the result
// (result.insertId = enquiry_id of the first row).
function insertBranchEnquiries(connection, values) {
  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        if (tempCon) tempCon.release();
        return reject(err);
      }
      const sql =
        "INSERT INTO appointment_enquiry (patient_type, enquirytype, patient_name, patient_phone, date, time, patient_location, reference, FDE_Name, note) VALUES ?";
      tempCon.query(sql, [values], function (error, result) {
        tempCon.release();
        if (error) return reject(error);
        resolve(result);
      });
    });
  });
}

async function addEnquiryWithMaster(appointments, opts) {
  const { cleanPhone, noteFn, defaultSource, labels } = opts;

  if (!Array.isArray(appointments) || appointments.length === 0) {
    const err = new Error("Invalid enquiry data");
    err.status = 400;
    throw err;
  }

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
    cleanPhone(appointment.patient_phone),
    appointment.date,
    appointment.time,
    location,
    appointment.reference,
    appointment.FDE_Name,
    appointment.note,
  ]);

  // 1. Branch table (primary store) — failure here fails the request
  const result = await insertBranchEnquiries(connection, values);

  // 2. Master table — failure is logged, never fails the request.
  //    Re-running 02_backfill_master_enquiry.sql recovers missed rows.
  let masterNote = "";
  try {
    await saveEnquiriesToMaster(appointments, {
      branchName: location,
      source: resolveSource(appointments[0], defaultSource),
      firstBranchEnquiryId: result.insertId,
    });
  } catch (masterError) {
    console.error("Failed to save enquiry to master_enquiry:", masterError);
    masterNote = ` [master_enquiry save failed: ${masterError.code || masterError.message}]`;
  }

  // 3. Note (same behaviour as V1)
  try {
    await noteFn(appointments);
    return labels.ok + masterNote;
  } catch (noteError) {
    console.error("Failed to add note:", noteError);
    return labels.noteFailed + masterNote;
  }
}

async function addEnquiryV2(appointments) {
  return addEnquiryWithMaster(appointments, {
    cleanPhone: (p) => String(p).replace(/^(\+91|91|0)+/, ""),
    noteFn: addNote,
    defaultSource: null, // app sends `source`; falls back to IVR if Call_Date present
    labels: {
      ok: "Enquiry and note added!",
      noteFailed: "Enquiry added, but failed to add note!",
    },
  });
}

async function addHelplineEnquiryV2(appointments) {
  return addEnquiryWithMaster(appointments, {
    cleanPhone: (p) => String(p).replace(/^0+/, ""),
    noteFn: addHelplineNote,
    defaultSource: SOURCES.HELPLINE,
    labels: {
      ok: "Helpline Enquiry and note added!",
      noteFailed: "Helpline Enquiry added, but failed to add note!",
    },
  });
}

module.exports = {
  addEnquiry,
  addHelplineEnquiry,
  addHelplineSpam,
  addIVRSpam,
  addEnquiryV2,
  addHelplineEnquiryV2,
};
