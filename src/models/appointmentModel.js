const { getConnectionByLocation } = require("../../databaseUtils");
const { getDoctorById } = require("./doctorModel");
const { addNote, addHelplineNote } = require("./noteModel");
const axios = require("axios");

function normalizeIndianPhone(phone) {
  if (!phone && phone !== 0) return null;
  // keep only digits
  const digits = String(phone).replace(/\D/g, "");

  if (digits.length === 10) return digits;
  if (digits.length > 10) {
    // keep last 10 digits (strip country/leading zeros/prefixes)
    return digits.slice(-10);
  }
  // too short or invalid
  return null;
}

function getConnectionPromise(pool) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, con) => {
      if (err) return reject(err);
      resolve(con);
    });
  });
}

function queryPromise(con, sql, params) {
  return new Promise((resolve, reject) => {
    con.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function createMasterPatientAndReturnGlobalId(
  masterCon,
  patientName,
  patientPhone,
  appointmentDate,
  location,
) {
  const masterSql = `
    INSERT INTO patientsMasterData
    (name, date, phone, mobile_2, location)
    VALUES (?, ?, ?, ?, ?)
  `;

  const result = await queryPromise(masterCon, masterSql, [
    patientName,
    appointmentDate,
    patientPhone,
    null,
    location,
  ]);

  return result.insertId;
}

// async function addAppointment(appointments) {
//   const { connection, location } = getConnectionByLocation(
//     appointments[0].patient_location,
//   );
//   if (!connection) {
//     const err = new Error("Invalid location");
//     err.status = 404;
//     throw err;
//   }

//   const values = appointments.map((appointment) => [
//     appointment.doctor_id,
//     appointment.patient_phone.replace(/^(\+91|91|0)+/, ""),
//     //appointment.patient_phone.replace(/^0+/, ""), // Remove starting "0"
//     appointment.patient_type,
//     appointment.date,
//     appointment.time,
//     "Pending",
//     location,
//     appointment.FDE_Name,
//     appointment.note,
//   ]);

//   const patientValues = appointments.map((patient) => [
//     0,
//     patient.date,
//     patient.patient_name,
//     0,
//     patient.patient_phone.replace(/^(\+91|91|0)+/, ""),
//     //patient.patient_phone.replace(/^0+/, ""), // Remove starting "0"
//     0,
//     null,
//     0,
//     0,
//     location,
//     0,
//   ]);

//   return new Promise((resolve, reject) => {
//     connection.getConnection(async function (err, tempCon) {
//       if (err) {
//         return reject(err);
//       }

//       if (appointments[0].patient_type === "New") {
//         console.log("new");
//         const sql =
//           "INSERT INTO patient (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient) VALUES ?";
//         tempCon.query(sql, [patientValues], async function (error, result) {
//           if (error) {
//             tempCon.release();
//             return reject(error);
//           }

//           const patientId = result.insertId;

//           const appointmentValues = values.map((value) => [
//             patientId,
//             ...value,
//           ]);

//           const appointmentSql =
//             "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
//           tempCon.query(
//             appointmentSql,
//             [appointmentValues],
//             async function (error, result) {
//               tempCon.release();
//               if (error) {
//                 return reject(error);
//               }

//               try {
//                 // Await the addNote function
//                 await addNote(appointments);
//                 console.log("WHATSAPP VALUES PARAMETERS:", values);
//                 await sendWhatsAppMsg(
//                   `+91${values[0][1]}`,
//                   values[0][0],
//                   values[0][3],
//                   values[0][4],
//                   location,
//                   values[0][7],
//                 );
//                 resolve("Appointment and note added!");
//               } catch (noteError) {
//                 console.error("Failed to add note:", noteError);
//                 // You can decide whether to reject or resolve with a warning
//                 resolve("Appointment added, but failed to add note!");
//               }
//             },
//           );
//         });
//       } else {
//         console.log("other than new");
//         const sql = `
//           SELECT patient_id
//           FROM patient
//           WHERE (phone = ? OR mobile_2 = ?)
//             AND ConfirmPatient = 1
//           ORDER BY date DESC
//           LIMIT 1
//         `;
//         tempCon.query(
//           sql,
//           [
//             appointments[0].patient_phone.replace(/^(\+91|91|0)+/, ""),
//             appointments[0].patient_phone.replace(/^(\+91|91|0)+/, ""),
//           ],
//           function (error, results) {
//             if (error) {
//               tempCon.release();
//               return reject(error);
//             }

//             if (results.length === 0) {
//               // Patient not found, insert into patient table
//               const insertPatientSql =
//                 "INSERT INTO patient (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient) VALUES ?";
//               tempCon.query(
//                 insertPatientSql,
//                 [patientValues],
//                 async function (error, result) {
//                   if (error) {
//                     tempCon.release();
//                     return reject(error);
//                   }

//                   const patientId = result.insertId;

//                   const appointmentValues = values.map((value) => {
//                     value[2] = "New"; // Change patient_type to 'New'
//                     return [patientId, ...value];
//                   });

//                   const appointmentSql =
//                     "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
//                   tempCon.query(
//                     appointmentSql,
//                     [appointmentValues],
//                     async function (error, result) {
//                       tempCon.release();
//                       if (error) {
//                         return reject(error);
//                       }

//                       try {
//                         // Await the addNote function
//                         await addNote(appointments);
//                         console.log("WHATSAPP VALUES PARAMETERS:", values);
//                         await sendWhatsAppMsg(
//                           `+91${values[0][1]}`,
//                           values[0][0],
//                           values[0][3],
//                           values[0][4],
//                           location,
//                           values[0][7],
//                         );
//                         resolve("Appointment and note added!");
//                       } catch (noteError) {
//                         console.error("Failed to add note:", noteError);
//                         // Decide how to handle the note error
//                         resolve("Appointment added, but failed to add note!");
//                       }
//                     },
//                   );
//                 },
//               );
//             } else {
//               // Patient found, use the existing patient ID
//               const patientId = results[0].patient_id;

//               const appointmentValues = values.map((value) => [
//                 patientId,
//                 ...value,
//               ]);

//               const appointmentSql =
//                 "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
//               tempCon.query(
//                 appointmentSql,
//                 [appointmentValues],
//                 async function (error, result) {
//                   tempCon.release();
//                   if (error) {
//                     return reject(error);
//                   }

//                   try {
//                     // Await the addNote function
//                     await addNote(appointments);
//                     console.log("WHATSAPP VALUES PARAMETERS:", values);
//                     await sendWhatsAppMsg(
//                       `+91${values[0][1]}`,
//                       values[0][0],
//                       values[0][3],
//                       values[0][4],
//                       location,
//                       values[0][7],
//                     );
//                     resolve("Appointment and note added!");
//                   } catch (noteError) {
//                     console.error("Failed to add note:", noteError);
//                     // Decide how to handle the note error
//                     resolve("Appointment added, but failed to add note!");
//                   }
//                 },
//               );
//             }
//           },
//         );
//       }
//     });
//   });
// }

// async function addAppointmentV1(appointments) {
//   const { connection: locationDB, location } =
//     getConnectionByLocation(patientLocation);

//   const { connection: masterDB } = getConnectionByLocation("Lead"); // Master DB
//   if (!locationDB || !masterDB) {
//     const err = new Error("Invalid location");
//     err.status = 404;
//     throw err;
//   }

//   const values = appointments.map((appointment) => [
//     appointment.doctor_id,
//     appointment.patient_phone.replace(/^(\+91|91|0)+/, ""),
//     //appointment.patient_phone.replace(/^0+/, ""), // Remove starting "0"
//     appointment.patient_type,
//     appointment.date,
//     appointment.time,
//     "Pending",
//     location,
//     appointment.FDE_Name,
//     appointment.note,
//   ]);

//   const patientValues = appointments.map((patient) => [
//     0,
//     patient.date,
//     patient.patient_name,
//     0,
//     patient.patient_phone.replace(/^(\+91|91|0)+/, ""),
//     //patient.patient_phone.replace(/^0+/, ""), // Remove starting "0"
//     0,
//     null,
//     0,
//     0,
//     location,
//     0,
//   ]);

//   return new Promise((resolve, reject) => {
//     masterDB.getConnection(async function (err, masterCon) {
//       if (err) {
//         return reject(err);
//       }

//       if (appointments[0].patient_type === "New") {
//         console.log("new");

//         // 1️⃣ INSERT INTO MASTER PATIENT TABLE FIRST
//         const masterSql = `
//     INSERT INTO patientsMasterData
//     (name, date, phone, mobile_2, location)
//     VALUES (?, ?, ?, ?, ?)
//   `;

//         const cleanedPhone = normalizeIndianPhone(
//           appointments[0].patient_phone
//         );

//         const masterValues = [
//           appointments[0].patient_name,
//           appointments[0].date,
//           cleanedPhone,
//           null,
//           location,
//         ];

//         masterCon.query(masterSql, masterValues, function (error, masterRes) {
//           if (error) {
//             tempCon.release();
//             return reject(error);
//           }

//           const globalId = masterRes.insertId; // 🔥 new global id

//           console.log("New Global ID:", globalId);

//           // 2️⃣ INSERT INTO OLD PATIENT TABLE AFTER GETTING GLOBAL ID
//           const sql = `
//             INSERT INTO patient
//             (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient, global_id)
//             VALUES ?
//           `;

//           // Add global_id inside your patientValues
//           const patientValuesWithGlobal = appointments.map((patient) => [
//             0,
//             patient.date,
//             patient.patient_name,
//             0,
//             cleanedPhone,
//             0,
//             null,
//             0,
//             0,
//             location,
//             0,
//             globalId, // 🔥 new global id added here
//           ]);

//           console.log(
//             "Patient Values with Global ID:",
//             patientValuesWithGlobal
//           );

//           tempCon.query(
//             sql,
//             [patientValuesWithGlobal],
//             async function (error, result) {
//               if (error) {
//                 tempCon.release();
//                 return reject(error);
//               }

//               const patientId = result.insertId;

//               const appointmentValues = values.map((value) => [
//                 patientId,
//                 ...value,
//               ]);

//               const appointmentSql =
//                 "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";

//               tempCon.query(
//                 appointmentSql,
//                 [appointmentValues],
//                 async function (error, result) {
//                   tempCon.release();
//                   if (error) return reject(error);

//                   try {
//                     await addNote(appointments);

//                     await sendWhatsAppMsg(
//                       `+91${values[0][1]}`,
//                       values[0][0],
//                       values[0][3],
//                       values[0][4],
//                       location,
//                       values[0][7]
//                     );

//                     resolve(
//                       "Master patient, patient record & appointment added!"
//                     );
//                   } catch (noteError) {
//                     resolve("Master + patient added, but failed to add note!");
//                   }
//                 }
//               );
//             }
//           );
//         });
//       } else {
//         console.log("other than new");
//         const sql = `
//           SELECT patient_id
//           FROM patient
//           WHERE (phone = ? OR mobile_2 = ?)
//             AND ConfirmPatient = 1
//           ORDER BY date DESC
//           LIMIT 1
//         `;
//         tempCon.query(
//           sql,
//           [
//             appointments[0].patient_phone.replace(/^(\+91|91|0)+/, ""),
//             appointments[0].patient_phone.replace(/^(\+91|91|0)+/, ""),
//           ],
//           function (error, results) {
//             if (error) {
//               tempCon.release();
//               return reject(error);
//             }

//             if (results.length === 0) {
//               // Patient not found, insert into patient table
//               const insertPatientSql =
//                 "INSERT INTO patient (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient) VALUES ?";
//               tempCon.query(
//                 insertPatientSql,
//                 [patientValues],
//                 async function (error, result) {
//                   if (error) {
//                     tempCon.release();
//                     return reject(error);
//                   }

//                   const patientId = result.insertId;

//                   const appointmentValues = values.map((value) => {
//                     value[2] = "New"; // Change patient_type to 'New'
//                     return [patientId, ...value];
//                   });

//                   const appointmentSql =
//                     "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
//                   tempCon.query(
//                     appointmentSql,
//                     [appointmentValues],
//                     async function (error, result) {
//                       tempCon.release();
//                       if (error) {
//                         return reject(error);
//                       }

//                       try {
//                         // Await the addNote function
//                         await addNote(appointments);
//                         console.log("WHATSAPP VALUES PARAMETERS:", values);
//                         await sendWhatsAppMsg(
//                           `+91${values[0][1]}`,
//                           values[0][0],
//                           values[0][3],
//                           values[0][4],
//                           location,
//                           values[0][7]
//                         );
//                         resolve("Appointment and note added!");
//                       } catch (noteError) {
//                         console.error("Failed to add note:", noteError);
//                         // Decide how to handle the note error
//                         resolve("Appointment added, but failed to add note!");
//                       }
//                     }
//                   );
//                 }
//               );
//             } else {
//               // Patient found, use the existing patient ID
//               const patientId = results[0].patient_id;

//               const appointmentValues = values.map((value) => [
//                 patientId,
//                 ...value,
//               ]);

//               const appointmentSql =
//                 "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
//               tempCon.query(
//                 appointmentSql,
//                 [appointmentValues],
//                 async function (error, result) {
//                   tempCon.release();
//                   if (error) {
//                     return reject(error);
//                   }

//                   try {
//                     // Await the addNote function
//                     await addNote(appointments);
//                     console.log("WHATSAPP VALUES PARAMETERS:", values);
//                     await sendWhatsAppMsg(
//                       `+91${values[0][1]}`,
//                       values[0][0],
//                       values[0][3],
//                       values[0][4],
//                       location,
//                       values[0][7]
//                     );
//                     resolve("Appointment and note added!");
//                   } catch (noteError) {
//                     console.error("Failed to add note:", noteError);
//                     // Decide how to handle the note error
//                     resolve("Appointment added, but failed to add note!");
//                   }
//                 }
//               );
//             }
//           }
//         );
//       }
//     });
//   });
// }

async function addAppointmentV1(appointments) {
  if (!appointments || appointments.length === 0) {
    throw new Error("Invalid appointment data");
  }

  const appt = appointments[0];
  //console.log("Appointment Data:", appt);
  const patientLocation = appt.patient_location;

  //--------------------------------
  // 1️⃣ GET DB CONNECTIONS
  //--------------------------------
  const { connection: locationDB, location } =
    getConnectionByLocation(patientLocation);
  const { connection: masterDB } = getConnectionByLocation("lead");

  if (!locationDB || !masterDB) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  //--------------------------------
  // 2️⃣ CLEAN PHONE NUMBER
  //--------------------------------
  const cleanedPhone = normalizeIndianPhone(appt.patient_phone);

  //--------------------------------
  // 3️⃣ PREPARE VALUES
  //--------------------------------
  const appointmentValues = appointments.map((a) => [
    a.doctor_id,
    cleanedPhone,
    a.patient_type,
    a.date,
    a.time,
    "Pending",
    location,
    a.FDE_Name,
    a.note,
  ]);

  //--------------------------------
  // 4️⃣ GET A LOCATION DB CONNECTION
  //--------------------------------
  const locCon = await getConnectionPromise(locationDB);
  const masterCon = await getConnectionPromise(masterDB);

  try {
    //----------------------------------------
    // CASE 1️⃣ — NEW PATIENT
    //----------------------------------------
    if (appt.patient_type === "New") {
      console.log("Creating NEW patient...");

      // Insert into MASTER
      const masterSql = `
        INSERT INTO patientsMasterData (name, date, phone, mobile_2, location)
        VALUES (?, ?, ?, ?, ?)
      `;

      const masterRes = await queryPromise(masterCon, masterSql, [
        appt.patient_name,
        appt.date,
        cleanedPhone,
        null,
        location,
      ]);

      const globalId = masterRes.insertId;
      console.log("Global Master ID:", globalId);

      //-----------------------------
      // Insert into PATIENT table
      //-----------------------------
      const patientSql = `
        INSERT INTO patient
        (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient, global_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const patientRes = await queryPromise(locCon, patientSql, [
        0,
        appt.date,
        appt.patient_name,
        0,
        cleanedPhone,
        0,
        null,
        0,
        0,
        location,
        0,
        globalId,
      ]);

      const patientId = patientRes.insertId;

      //-----------------------------
      // Insert into APPOINTMENTS
      //-----------------------------
      const apptSql = `
        INSERT INTO appointment
        (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note)
        VALUES ?
      `;

      const wrappedAppointments = appointmentValues.map((v) => [
        patientId,
        ...v,
      ]);

      await queryPromise(locCon, apptSql, [wrappedAppointments]);

      //------------------------------------
      // Add note + WhatsApp message
      //------------------------------------
      await addNote(appointments);

      await sendWhatsAppMsg(
        `+91${cleanedPhone}`,
        appt.doctor_id,
        appt.date,
        appt.time,
        location,
        appt.FDE_Name,
      );

      return "New patient + appointment created successfully!";
    }

    //----------------------------------------
    // CASE 2️⃣ — EXISTING PATIENT
    //----------------------------------------
    console.log("EXISTING patient flow");

    const findSql = `
      SELECT patient_id
      FROM patient
      WHERE (phone = ? OR mobile_2 = ?)
        AND ConfirmPatient = 1
      ORDER BY date DESC
      LIMIT 1
    `;

    const existing = await queryPromise(locCon, findSql, [
      cleanedPhone,
      cleanedPhone,
    ]);

    let patientId;

    if (existing.length > 0) {
      patientId = existing[0].patient_id;
    } else {
      //------------------------------------------
      // Patient not found → Insert as NEW
      //------------------------------------------
      const newPatientSql = `
        INSERT INTO patient
        (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const patientRes = await queryPromise(locCon, newPatientSql, [
        0,
        appt.date,
        appt.patient_name,
        0,
        cleanedPhone,
        0,
        null,
        0,
        0,
        location,
        0,
      ]);

      patientId = patientRes.insertId;

      // Set patient type to New
      appointmentValues.forEach((v) => (v[2] = "New"));
    }

    //------------------------------------------
    // Insert Appointment
    //------------------------------------------
    const apptSql = `
      INSERT INTO appointment
      (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note)
      VALUES ?
    `;

    const wrapped = appointmentValues.map((v) => [patientId, ...v]);

    await queryPromise(locCon, apptSql, [wrapped]);

    //------------------------------------
    // Add Note + WhatsApp
    //------------------------------------
    await addNote(appointments);

    await sendWhatsAppMsg(
      `+91${cleanedPhone}`,
      appt.doctor_id,
      appt.date,
      appt.time,
      location,
      appt.FDE_Name,
    );

    return "Existing patient appointment created successfully!";
  } catch (err) {
    throw err;
  } finally {
    locCon.release();
    masterCon.release();
  }
}

// async function addHelplineAppointment(appointments) {
//   const { connection, location } = getConnectionByLocation(
//     appointments[0].patient_location,
//   );

//   const { connection: masterDB } = getConnectionByLocation("lead");
//   if (!connection) {
//     const err = new Error("Invalid location");
//     err.status = 404;
//     throw err;
//   }

//   const values = appointments.map((appointment) => [
//     appointment.doctor_id,
//     appointment.patient_phone.replace(/^0+/, ""), // Remove starting "0"
//     appointment.patient_type,
//     appointment.date,
//     appointment.time,
//     "Pending",
//     location,
//     appointment.FDE_Name,
//     appointment.note,
//   ]);

//   const patientValues = appointments.map((patient) => [
//     0,
//     patient.date,
//     patient.patient_name,
//     0,
//     patient.patient_phone.replace(/^0+/, ""), // Remove starting "0"
//     0,
//     0,
//     0,
//     0,
//     location,
//     0,
//   ]);

//   return new Promise((resolve, reject) => {
//     connection.getConnection(async function (err, tempCon) {
//       if (err) {
//         return reject(err);
//       }

//       if (appointments[0].patient_type === "New") {
//         console.log("new");
//         const sql =
//           "INSERT INTO patient (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient) VALUES ?";
//         tempCon.query(sql, [patientValues], async function (error, result) {
//           if (error) {
//             tempCon.release();
//             return reject(error);
//           }

//           const patientId = result.insertId;

//           const appointmentValues = values.map((value) => [
//             patientId,
//             ...value,
//           ]);

//           const appointmentSql =
//             "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
//           tempCon.query(
//             appointmentSql,
//             [appointmentValues],
//             async function (error, result) {
//               tempCon.release();
//               if (error) {
//                 return reject(error);
//               }

//               try {
//                 // Await the addNote function
//                 await addHelplineNote(appointments);
//                 console.log("WHATSAPP VALUES PARAMETERS:", values);
//                 await sendWhatsAppMsg(
//                   `+91${values[0][1]}`,
//                   values[0][0],
//                   values[0][3],
//                   values[0][4],
//                   location,
//                   values[0][7],
//                 );
//                 resolve("Helpline Appointment and note added!");
//               } catch (noteError) {
//                 console.error("Failed to add Helpline note:", noteError);
//                 // You can decide whether to reject or resolve with a warning
//                 resolve("Helpline Appointment added, but failed to add note!");
//               }
//             },
//           );
//         });
//       } else {
//         console.log("other than new");
//         const sql = `
//           SELECT patient_id
//           FROM patient
//           WHERE (phone = ? OR mobile_2 = ?)
//             AND ConfirmPatient = 1
//           ORDER BY date DESC
//           LIMIT 1
//         `;
//         tempCon.query(
//           sql,
//           [
//             appointments[0].patient_phone.replace(/^0+/, ""),
//             appointments[0].patient_phone.replace(/^0+/, ""),
//           ],
//           function (error, results) {
//             if (error) {
//               tempCon.release();
//               return reject(error);
//             }

//             if (results.length === 0) {
//               // Patient not found, insert into patient table
//               const insertPatientSql =
//                 "INSERT INTO patient (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient) VALUES ?";
//               tempCon.query(
//                 insertPatientSql,
//                 [patientValues],
//                 async function (error, result) {
//                   if (error) {
//                     tempCon.release();
//                     return reject(error);
//                   }

//                   const patientId = result.insertId;

//                   const appointmentValues = values.map((value) => {
//                     value[2] = "New"; // Change patient_type to 'New'
//                     return [patientId, ...value];
//                   });

//                   const appointmentSql =
//                     "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
//                   tempCon.query(
//                     appointmentSql,
//                     [appointmentValues],
//                     async function (error, result) {
//                       tempCon.release();
//                       if (error) {
//                         return reject(error);
//                       }

//                       try {
//                         // Await the addNote function
//                         await addHelplineNote(appointments);
//                         console.log("WHATSAPP VALUES PARAMETERS:", values);
//                         await sendWhatsAppMsg(
//                           `+91${values[0][1]}`,
//                           values[0][0],
//                           values[0][3],
//                           values[0][4],
//                           location,
//                           values[0][7],
//                         );
//                         resolve("Helpline Appointment and note added!");
//                       } catch (noteError) {
//                         console.error(
//                           "Failed to add helpline note:",
//                           noteError,
//                         );
//                         // Decide how to handle the note error
//                         resolve(
//                           "Helpline Appointment added, but failed to add note!",
//                         );
//                       }
//                     },
//                   );
//                 },
//               );
//             } else {
//               // Patient found, use the existing patient ID
//               const patientId = results[0].patient_id;

//               const appointmentValues = values.map((value) => [
//                 patientId,
//                 ...value,
//               ]);

//               const appointmentSql =
//                 "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
//               tempCon.query(
//                 appointmentSql,
//                 [appointmentValues],
//                 async function (error, result) {
//                   tempCon.release();
//                   if (error) {
//                     return reject(error);
//                   }

//                   try {
//                     // Await the addNote function
//                     await addHelplineNote(appointments);
//                     console.log("WHATSAPP VALUES PARAMETERS:", values);
//                     await sendWhatsAppMsg(
//                       `+91${values[0][1]}`,
//                       values[0][0],
//                       values[0][3],
//                       values[0][4],
//                       location,
//                       values[0][7],
//                     );
//                     resolve("Helpline Appointment and note added!");
//                   } catch (noteError) {
//                     console.error("Failed to add helpline note:", noteError);
//                     // Decide how to handle the note error
//                     resolve(
//                       "Helpline Appointment added, but failed to add note!",
//                     );
//                   }
//                 },
//               );
//             }
//           },
//         );
//       }
//     });
//   });
// }

async function addHelplineAppointment(appointments) {
  const { connection, location } = getConnectionByLocation(
    appointments[0].patient_location,
  );

  const { connection: masterDB } = getConnectionByLocation("lead");

  if (!connection || !masterDB) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  const cleanedPhone = appointments[0].patient_phone.replace(/^0+/, "");

  const values = appointments.map((appointment) => [
    appointment.doctor_id,
    cleanedPhone,
    appointment.patient_type,
    appointment.date,
    appointment.time,
    "Pending",
    location,
    appointment.FDE_Name,
    appointment.note,
  ]);

  return new Promise((resolve, reject) => {
    connection.getConnection(async function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      masterDB.getConnection(async function (masterErr, masterCon) {
        if (masterErr) {
          tempCon.release();
          return reject(masterErr);
        }

        try {
          //----------------------------------------
          // NEW PATIENT
          //----------------------------------------
          if (appointments[0].patient_type === "New") {
            console.log("new");

            const masterSql = `
              INSERT INTO patientsMasterData
              (name, date, phone, mobile_2, location)
              VALUES (?, ?, ?, ?, ?)
            `;

            const masterResult = await queryPromise(masterCon, masterSql, [
              appointments[0].patient_name,
              appointments[0].date,
              cleanedPhone,
              null,
              location,
            ]);

            const globalId = masterResult.insertId;

            const patientValues = appointments.map((patient) => [
              0,
              patient.date,
              patient.patient_name,
              0,
              cleanedPhone,
              0,
              0,
              0,
              0,
              location,
              0,
              globalId,
            ]);

            const sql = `
              INSERT INTO patient
              (
                Uid_no,
                date,
                name,
                sex,
                phone,
                age,
                reference_type,
                address,
                registration_id,
                patient_location,
                ConfirmPatient,
                global_id
              )
              VALUES ?
            `;

            tempCon.query(sql, [patientValues], async function (error, result) {
              if (error) {
                tempCon.release();
                masterCon.release();
                return reject(error);
              }

              const patientId = result.insertId;

              const appointmentValues = values.map((value) => [
                patientId,
                ...value,
              ]);

              const appointmentSql = `
                INSERT INTO appointment
                (
                  patient_id,
                  doctor_id,
                  patient_phone,
                  patient_type,
                  appointment_timestamp,
                  appointment_time,
                  status,
                  patient_location,
                  FDE_Name,
                  note
                )
                VALUES ?
              `;

              tempCon.query(
                appointmentSql,
                [appointmentValues],
                async function (error) {
                  tempCon.release();
                  masterCon.release();

                  if (error) {
                    return reject(error);
                  }

                  try {
                    await addHelplineNote(appointments);

                    await sendWhatsAppMsg(
                      `+91${cleanedPhone}`,
                      values[0][0],
                      values[0][3],
                      values[0][4],
                      location,
                      values[0][7],
                    );

                    resolve("Helpline Appointment and note added!");
                  } catch (noteError) {
                    console.error(noteError);
                    resolve(
                      "Helpline Appointment added, but failed to add note!",
                    );
                  }
                },
              );
            });

            return;
          }

          //----------------------------------------
          // EXISTING PATIENT FLOW
          //----------------------------------------
          console.log("other than new");

          const findPatientSql = `
            SELECT patient_id
            FROM patient
            WHERE (phone = ? OR mobile_2 = ?)
              AND ConfirmPatient = 1
            ORDER BY date DESC
            LIMIT 1
          `;

          tempCon.query(
            findPatientSql,
            [cleanedPhone, cleanedPhone],
            async function (error, results) {
              if (error) {
                tempCon.release();
                masterCon.release();
                return reject(error);
              }

              //----------------------------------------
              // PATIENT NOT FOUND
              //----------------------------------------
              if (results.length === 0) {
                const masterSql = `
                  INSERT INTO patientsMasterData
                  (name, date, phone, mobile_2, location)
                  VALUES (?, ?, ?, ?, ?)
                `;

                const masterResult = await queryPromise(masterCon, masterSql, [
                  appointments[0].patient_name,
                  appointments[0].date,
                  cleanedPhone,
                  null,
                  location,
                ]);

                const globalId = masterResult.insertId;

                const patientValues = appointments.map((patient) => [
                  0,
                  patient.date,
                  patient.patient_name,
                  0,
                  cleanedPhone,
                  0,
                  0,
                  0,
                  0,
                  location,
                  0,
                  globalId,
                ]);

                const insertPatientSql = `
                  INSERT INTO patient
                  (
                    Uid_no,
                    date,
                    name,
                    sex,
                    phone,
                    age,
                    reference_type,
                    address,
                    registration_id,
                    patient_location,
                    ConfirmPatient,
                    global_id
                  )
                  VALUES ?
                `;

                tempCon.query(
                  insertPatientSql,
                  [patientValues],
                  async function (error, result) {
                    if (error) {
                      tempCon.release();
                      masterCon.release();
                      return reject(error);
                    }

                    const patientId = result.insertId;

                    const appointmentValues = values.map((value) => {
                      value[2] = "New";
                      return [patientId, ...value];
                    });

                    const appointmentSql = `
                      INSERT INTO appointment
                      (
                        patient_id,
                        doctor_id,
                        patient_phone,
                        patient_type,
                        appointment_timestamp,
                        appointment_time,
                        status,
                        patient_location,
                        FDE_Name,
                        note
                      )
                      VALUES ?
                    `;

                    tempCon.query(
                      appointmentSql,
                      [appointmentValues],
                      async function (error) {
                        tempCon.release();
                        masterCon.release();

                        if (error) {
                          return reject(error);
                        }

                        try {
                          await addHelplineNote(appointments);

                          await sendWhatsAppMsg(
                            `+91${cleanedPhone}`,
                            values[0][0],
                            values[0][3],
                            values[0][4],
                            location,
                            values[0][7],
                          );

                          resolve("Helpline Appointment and note added!");
                        } catch (noteError) {
                          console.error(noteError);
                          resolve(
                            "Helpline Appointment added, but failed to add note!",
                          );
                        }
                      },
                    );
                  },
                );
              } else {
                //----------------------------------------
                // PATIENT FOUND
                //----------------------------------------
                const patientId = results[0].patient_id;

                const appointmentValues = values.map((value) => [
                  patientId,
                  ...value,
                ]);

                const appointmentSql = `
                  INSERT INTO appointment
                  (
                    patient_id,
                    doctor_id,
                    patient_phone,
                    patient_type,
                    appointment_timestamp,
                    appointment_time,
                    status,
                    patient_location,
                    FDE_Name,
                    note
                  )
                  VALUES ?
                `;

                tempCon.query(
                  appointmentSql,
                  [appointmentValues],
                  async function (error) {
                    tempCon.release();
                    masterCon.release();

                    if (error) {
                      return reject(error);
                    }

                    try {
                      await addHelplineNote(appointments);

                      await sendWhatsAppMsg(
                        `+91${cleanedPhone}`,
                        values[0][0],
                        values[0][3],
                        values[0][4],
                        location,
                        values[0][7],
                      );

                      resolve("Helpline Appointment and note added!");
                    } catch (noteError) {
                      console.error(noteError);
                      resolve(
                        "Helpline Appointment added, but failed to add note!",
                      );
                    }
                  },
                );
              }
            },
          );
        } catch (error) {
          tempCon.release();
          masterCon.release();
          reject(error);
        }
      });
    });
  });
}

const sendWhatsAppMsg = async (
  patientPhone,
  branchDoctor,
  appoDate,
  appoTime,
  branchLocation,
  fdName,
) => {
  // const doctor = await getDoctorById(branchLocation, branchDoctor);

  // if (!doctor) return false;
  // const doctorName = doctor[0].name;
  //console.log(doctorName);
  // Define the start and end time
  const startTime = new Date(`1970-01-01T${appoTime}:00`).toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" },
  );
  const endTime = new Date(
    new Date(`1970-01-01T${appoTime}:00`).getTime() + 60 * 60 * 1000,
  ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const timeRange = `${startTime} to ${endTime}`;

  // Branch location details (same as the PHP function)
  let branchaddress = "";
  let helpline = "";
  let googlemap = "";

  switch (branchLocation) {
    case "DP Road":
      branchaddress =
        "Ground Floor, Millenium Star Extension, Dhole Patil Road, Pune";
      helpline = "8888288884";
      googlemap = "https://goo.gl/maps/5hV85GqaVfSCRejC7";
      break;
    case "Tilak Road":
      branchaddress = "Mangalmurti Complex, 105, Tilak Road, Pune";
      helpline = "8888288884";
      googlemap = "https://maps.app.goo.gl/ZLiwZr5aLUwU8XdPA";
      break;
    case "Salunkhe-Vihar":
    case "Salunke Vihar":
      branchaddress = "101/102 Girme Towers, Wanowrie, Pune";
      helpline = "8888522226";
      googlemap = "https://maps.app.goo.gl/cnDzyEFSiDBqVxXs8";
      break;
    case "Baner":
      branchaddress = "1st floor, Crystal Empire Building, Baner, Pune";
      helpline = "8888622221";
      googlemap = "https://goo.gl/maps/7yBP3kPn2C9jtNwz6";
      break;
    case "Pimpri-Chinchwad":
    case "Chinchwad":
      branchaddress = "Second floor, Premier Plaza, Chinchwad, Pune";
      helpline = "8888200004";
      googlemap = "https://maps.app.goo.gl/wXetuZV9sFqxhebn7";
      break;
    case "Chakan":
      branchaddress = "1st Floor, Gokul Complex, Chakan, Pune";
      helpline = "8888596666";
      googlemap = "https://goo.gl/maps/cNdvDPK2sqTM9Rwp9";
      break;
    case "Dighi":
      branchaddress = "Amrutdhara Commercial Hub, Charholi Budruk, Pune";
      helpline = "8483999588";
      googlemap = "https://maps.app.goo.gl/9wNEDTMtG3qwtsYLA";
      break;
    case "Katraj":
      branchaddress =
        "Ground Floor, Atmosphere Building, Ambegaon Budruk, Pune";
      helpline = "9175235343";
      googlemap = "";
      break;
    case "Undri":
      branchaddress = "220, Marvel sangria, Mohammed Wadi, Pune";
      helpline = "8888522226";
      googlemap = "https://maps.app.goo.gl/YPi5Fd455tjsTRLP6";
      break;
    case "Hinjewadi":
      branchaddress = "AH Infotech, 3rd Floor, Hinjawadi, Pune";
      helpline = "9175232340";
      googlemap = "https://maps.app.goo.gl/E75SswJ4EJTY9JK27";
      break;
    case "Vashi":
      branchaddress = "Unit no 18, Palm Beach Galleria, Vashi, New Mumbai";
      helpline = "9175232308";
      googlemap = "";
      break;
    case "Navi-Mumbai":
    case "Navi Mumbai":
      branchaddress = "Gahlot Majesty, Navi Mumbai";
      helpline = "8888166667";
      googlemap = "https://goo.gl/maps/QV383Zezxs1jWRCu6";
      break;
    case "Kemps-Corner":
      branchaddress =
        "3rd Floor, Advani Chambers, August Kranti Marg, Kemps Corner, Malabar Hill, Mumbai, Maharashtra 400036";
      helpline = "8888266664";
      googlemap = "https://goo.gl/maps/ZHNqt9YcWZg5EXmG6";
      break;
    case "Thane":
      branchaddress = "Cosmos Jewels, 3rd floor, Thane West";
      helpline = "8575999994";
      googlemap = "https://maps.app.goo.gl/tcGBRcV72VmSv4Zq6";
      break;
    case "Andheri":
      branchaddress =
        "B-3 ,C-4, 1st floor, Mayfair Meridien HSG Society, Andheri West, Mumbai";
      helpline = "9156634201";
      googlemap = "https://goo.gl/maps/PaupXzJFyVpEauG88";
      break;
    case "Nashik":
      branchaddress = "3rd floor, Above MacDonald, Nashik";
      helpline = "8888366662";
      googlemap = "https://goo.gl/maps/FfocHX1R3vK3dqNM7";
      break;
    case "Kolhapur":
      branchaddress =
        "Kukreja Nursing home, 232 3b 2a, near Telephone Bhavan, Tarabai Park, Kolhapur, Maharashtra 416003.";
      helpline = "8956223460";
      googlemap = "https://goo.gl/maps/MJuBSSbUKzwcphut8";
      break;
    case "Latur":
      branchaddress = "MG Rd, Latur";
      helpline = "8956223459";
      googlemap = "https://goo.gl/maps/m5W9qXUGEAkE1p6BA";
      break;
    case "Lucknow":
      branchaddress = "L-2/761, Vinay Khand 2, Lucknow";
      helpline = "";
      googlemap = "";
      break;
    case "Bangalore":
    case "JP Nagar":
      branchaddress = "Krishna towers, Ground floor, JP Nagar, Bengaluru";
      helpline = "8888133338";
      googlemap = "https://goo.gl/maps/mZye2mYQt9inHV3F8";
      break;
    case "Indiranagar":
      branchaddress = "3rd Floor Krishvi Aspire, Indiranagar, Bengaluru";
      helpline = "8197978641";
      googlemap = "https://goo.gl/maps/9xHENbGGTb4C9guC8";
      break;
    case "Sahakarnagar":
    case "Sahakar Nagar":
      branchaddress =
        "1st Floor, above McDonalds, F Block, Sahakar Nagar, Bengaluru";
      helpline = "9731118056";
      googlemap = "https://goo.gl/maps/fKx2Z5iRAuEQFugTA";
      break;
    case "Belagavi":
    case "Belgavi":
      branchaddress = "C/O Sbg hospital, Belagavi";
      helpline = "8600002156";
      googlemap = "https://maps.app.goo.gl/qnLx7Yc8VZJHeVsa7";
      break;
    case "Hyderabad":
      branchaddress = "1st Floor, DK's Kavya House, Jubilee Hills, Hyderabad";
      helpline = "7680862049";
      googlemap = "https://goo.gl/maps/ouqsC1e5AA11EBhR7";
      break;
    case "Ludhiana":
      branchaddress = "Gobind Nagar, Ludhiana, Punjab";
      helpline = "7986935908";
      googlemap = "https://goo.gl/maps/B6GboeLp3bWrLnGU9";
      break;
    case "Surat":
      branchaddress = "Third Floor, VIP Plaza, Surat";
      helpline = "7436008844";
      googlemap = "https://goo.gl/maps/jZ9cCPBqwP43x6Q58";
      break;
    case "Gurgaon-49":
    case "Gurgaon Sector 49":
      branchaddress =
        "Spaze ITech Park, Tower C, Ground Floor, Sector 49, Gurugram";
      helpline = "9990479800";
      googlemap = "https://maps.app.goo.gl/iS8WboxRXfR8TF8BA";
      break;
    case "Gurgaon-14":
    case "Gurgaon Sector 14":
      branchaddress = "1st Floor, Sheetla Chamber, Sector 14, Gurugram";
      helpline = "9990473800";
      googlemap = "https://maps.app.goo.gl/yCXnMS373kSmS54HA";
      break;
    case "Kalaburagi":
      branchaddress = "Shanta hospital, 4 th floor, Kalaburagi";
      helpline = "9164045999";
      googlemap = "";
      break;
    case "HSR":
      branchaddress = "1st Floor, Krishna Complex, HSR Layout, Bengaluru";
      helpline = "8792950455";
      googlemap = "";
      break;
    case "Rajajinagar":
    case "Rajaji Nagar":
      branchaddress = "2nd floor, above HDFC Bank, Rajajinagar, Bengaluru";
      helpline = "7996126669";
      googlemap = "";
      break;
    case "Sarjapura":
      branchaddress = "Trinity Complex, Sarjapura, Bengaluru";
      helpline = "9036053501";
      googlemap = "";
      break;
    case "Mysore":
      branchaddress = "1st and 2nd Floor, Scarlet Towers, Mysore";
      helpline = "8971928968";
      googlemap = "https://g.co/kgs/qNo5GKP";
      break;
    case "Secunderabad":
      branchaddress =
        "1st floor, Chandragiri Colony, Tirumalgiri, Secunderabad";
      helpline = "8977520083";
      googlemap = "https://g.co/kgs/ZCihPnZ";
      break;
    default:
      branchaddress = "Location not found.";
      helpline = "";
      googlemap = "";
      break;
  }

  // Prepare data to send in the API request
  const data = {
    broadcast_name: "appointment_msg",
    template_name: "appt_confirmation_final2",
    parameters: [
      { name: "address", value: branchaddress },
      { name: "appointment_date", value: appoDate },
      { name: "appointment_time", value: timeRange },
      { name: "helpline", value: helpline },
      { name: "map_link", value: googlemap },
      { name: "fde_name", value: fdName },
      { name: "branch_name", value: branchLocation },
    ],
  };

  // Make the API call to send the WhatsApp message
  const whatsappUrl = `https://live-server-115992.wati.io/api/v1/sendTemplateMessage?whatsappNumber=${patientPhone}`;

  try {
    const response = await axios.post(whatsappUrl, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MTU3MzdjNC04NzhjLTQ0ZGQtOTBjZC04ZmY2NGRlMDUyYzkiLCJ1bmlxdWVfbmFtZSI6InByYXNhZGhoYzIwMjNAZ21haWwuY29tIiwibmFtZWlkIjoicHJhc2FkaGhjMjAyM0BnbWFpbC5jb20iLCJlbWFpbCI6InByYXNhZGhoYzIwMjNAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMTAvMjYvMjAyMyAxMjozMzo1MiIsImRiX25hbWUiOiIxMTU5OTIiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.bC3SVh28fDgASthq1A8oRXrCvrNxQrna-BWh4p_R3eg", // Replace with your actual API key
      },
    });

    //console.log("Message sent successfully:", response.data);
  } catch (error) {
    //console.error("Error sending WhatsApp message:", error);
  }
};

// function getConnectionPromise(connection) {
//   return new Promise((resolve, reject) => {
//     connection.getConnection((err, tempCon) => {
//       if (err) return reject(err);
//       resolve(tempCon);
//     });
//   });
// }

// async function addAppointment(appointments) {
//   const { connection, location } = getConnectionByLocation(
//     appointments[0].patient_location
//   );
//   if (!connection) throw new Error("Invalid location");

//   const values = appointments.map((appointment) => [
//     appointment.doctor_id,
//     appointment.patient_phone.replace(/^0+/, ""),
//     appointment.patient_type,
//     appointment.date,
//     appointment.time,
//     "Pending",
//     location,
//     appointment.FDE_Name,
//     appointment.note,
//   ]);

//   const patientValues = appointments.map((patient) => [
//     0,
//     patient.date,
//     patient.patient_name,
//     0,
//     patient.patient_phone.replace(/^0+/, ""),
//     0,
//     0,
//     0,
//     0,
//     location,
//     0,
//   ]);

//   const tempCon = await getConnectionPromise(connection);
//   try {
//     let patientId;
//     if (appointments[0].patient_type === "New") {
//       patientId = await insertNewPatient(tempCon, patientValues);
//     } else {
//       patientId =
//         (await fetchExistingPatientId(
//           tempCon,
//           appointments[0].patient_phone
//         )) || (await insertNewPatient(tempCon, patientValues));
//     }
//     await insertAppointment(tempCon, patientId, values);
//     await addNoteAndNotify(appointments, values, location);

//     tempCon.release();
//     return "Appointment and note added!";
//   } catch (error) {
//     tempCon.release();
//     console.error("Error in addAppointment:", error);
//     throw error;
//   }
// }

// async function insertNewPatient(tempCon, patientValues) {
//   const sql = `INSERT INTO patient (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient) VALUES ?`;
//   const result = await tempCon.query(sql, [patientValues]);
//   return result.insertId;
// }

// async function insertAppointment(tempCon, patientId, values) {
//   const appointmentValues = values.map((value) => [patientId, ...value]);
//   const appointmentSql = `INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?`;
//   await tempCon.query(appointmentSql, [appointmentValues]);
// }

// async function fetchExistingPatientId(tempCon, phone) {
//   const sql = `SELECT patient_id FROM patient WHERE (phone = ? OR mobile_2 = ?) AND ConfirmPatient = 1 ORDER BY date DESC LIMIT 1`;
//   const results = await tempCon.query(sql, [
//     phone.replace(/^0+/, ""),
//     phone.replace(/^0+/, ""),
//   ]);
//   return results.length ? results[0].patient_id : null;
// }

// async function addNoteAndNotify(appointments, values, location) {
//   await addNote(appointments);
//   console.log("WHATSAPP VALUES PARAMETERS:", values);
//   await sendWhatsAppMsg(
//     `+91${values[0][1]}`,
//     values[0][0],
//     values[0][4],
//     values[0][5],
//     location,
//     values[0][7]
//   );
// }

// =====================================================================
// V2 — books the appointment exactly as the current functions do, then
// records the lead in hhc_appointments.master_enquiry with source +
// branch name. The existing functions are called unchanged.
// =====================================================================

const {
  SOURCES,
  resolveSource,
  saveAppointmentsToMaster,
} = require("./masterEnquiryModel");

async function saveAppointmentLeadToMaster(appointments, defaultSource) {
  try {
    const { location } = getConnectionByLocation(
      appointments[0].patient_location,
    );
    await saveAppointmentsToMaster(appointments, {
      branchName: location,
      source: resolveSource(appointments[0], defaultSource),
    });
  } catch (masterError) {
    // Never fail a booking because the master copy failed
    console.error("Failed to save appointment to master_enquiry:", masterError);
    return ` [master_enquiry save failed: ${masterError.code || masterError.message}]`;
  }
  return "";
}

async function addAppointmentV2(appointments) {
  const result = await addAppointmentV1(appointments); // throws on failure
  const masterNote = await saveAppointmentLeadToMaster(appointments, null);
  return result + masterNote;
}

async function addHelplineAppointmentV2(appointments) {
  const result = await addHelplineAppointment(appointments); // rejects on failure
  const masterNote = await saveAppointmentLeadToMaster(
    appointments,
    SOURCES.HELPLINE,
  );
  return result + masterNote;
}

module.exports = {
  addHelplineAppointment,
  addAppointmentV1,
  addAppointmentV2,
  addHelplineAppointmentV2,
};
