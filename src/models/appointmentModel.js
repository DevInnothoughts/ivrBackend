const { getConnectionByLocation } = require("../../databaseUtils");

async function addAppointment(appointments) {
  const { connection, location } = getConnectionByLocation(
    appointments[0].patient_location
  );
  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  const values = appointments.map((appointment) => [
    appointment.doctor_id,
    appointment.patient_phone.replace(/^0+/, ""), // Remove starting "0",
    appointment.patient_type,
    appointment.date,
    appointment.time,
    "Pending",
    location,
    appointment.FDE_Name,
    appointment.note,
  ]);

  const patientValues = appointments.map((patient) => [
    0,
    patient.date,
    patient.patient_name,
    0,
    patient.patient_phone.replace(/^0+/, ""), // Remove starting "0",
    0,
    0,
    0,
    0,
    location,
    0,
  ]);

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        tempCon.release();
        return reject(err);
      }

      var sql =
        "INSERT INTO patient (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient) VALUES ?";
      tempCon.query(sql, [patientValues], function (error, result) {
        if (error) {
          tempCon.release();
          return reject(error);
        }

        const patientId = result.insertId;

        const appointmentValues = values.map((value) => [patientId, ...value]);

        sql =
          "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
        tempCon.query(sql, [appointmentValues], function (error, result) {
          tempCon.release();
          if (error) {
            return reject(error);
          }
          resolve("Appointment added!");
        });
      });
    });
  });
}

module.exports = { addAppointment };
