const { getConnectionByLocation } = require("../../databaseUtils");
const { getDoctorById } = require("./doctorModel");
const { addNote } = require("./noteModel");
const axios = require("axios");

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
    appointment.patient_phone.replace(/^0+/, ""), // Remove starting "0"
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
    patient.patient_phone.replace(/^0+/, ""), // Remove starting "0"
    0,
    0,
    0,
    0,
    location,
    0,
  ]);

  return new Promise((resolve, reject) => {
    connection.getConnection(async function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      if (appointments[0].patient_type === "New") {
        console.log("new");
        const sql =
          "INSERT INTO patient (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient) VALUES ?";
        tempCon.query(sql, [patientValues], async function (error, result) {
          if (error) {
            tempCon.release();
            return reject(error);
          }

          const patientId = result.insertId;

          const appointmentValues = values.map((value) => [
            patientId,
            ...value,
          ]);

          const appointmentSql =
            "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
          tempCon.query(
            appointmentSql,
            [appointmentValues],
            async function (error, result) {
              tempCon.release();
              if (error) {
                return reject(error);
              }

              try {
                // Await the addNote function
                await addNote(appointments);
                console.log("WHATSAPP VALUES PARAMETERS:", values);
                await sendWhatsAppMsg(
                  `+91${values[0][1]}`,
                  values[0][0],
                  values[0][3],
                  values[0][4],
                  location,
                  values[0][7]
                );
                resolve("Appointment and note added!");
              } catch (noteError) {
                console.error("Failed to add note:", noteError);
                // You can decide whether to reject or resolve with a warning
                resolve("Appointment added, but failed to add note!");
              }
            }
          );
        });
      } else {
        console.log("other than new");
        const sql = `
          SELECT patient_id
          FROM patient
          WHERE (phone = ? OR mobile_2 = ?)
            AND ConfirmPatient = 1
          ORDER BY date DESC
          LIMIT 1
        `;
        tempCon.query(
          sql,
          [
            appointments[0].patient_phone.replace(/^0+/, ""),
            appointments[0].patient_phone.replace(/^0+/, ""),
          ],
          function (error, results) {
            if (error) {
              tempCon.release();
              return reject(error);
            }

            if (results.length === 0) {
              // Patient not found, insert into patient table
              const insertPatientSql =
                "INSERT INTO patient (Uid_no, date, name, sex, phone, age, reference_type, address, registration_id, patient_location, ConfirmPatient) VALUES ?";
              tempCon.query(
                insertPatientSql,
                [patientValues],
                async function (error, result) {
                  if (error) {
                    tempCon.release();
                    return reject(error);
                  }

                  const patientId = result.insertId;

                  const appointmentValues = values.map((value) => {
                    value[2] = "New"; // Change patient_type to 'New'
                    return [patientId, ...value];
                  });

                  const appointmentSql =
                    "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
                  tempCon.query(
                    appointmentSql,
                    [appointmentValues],
                    async function (error, result) {
                      tempCon.release();
                      if (error) {
                        return reject(error);
                      }

                      try {
                        // Await the addNote function
                        await addNote(appointments);
                        console.log("WHATSAPP VALUES PARAMETERS:", values);
                        await sendWhatsAppMsg(
                          `+91${values[0][1]}`,
                          values[0][0],
                          values[0][3],
                          values[0][4],
                          location,
                          values[0][7]
                        );
                        resolve("Appointment and note added!");
                      } catch (noteError) {
                        console.error("Failed to add note:", noteError);
                        // Decide how to handle the note error
                        resolve("Appointment added, but failed to add note!");
                      }
                    }
                  );
                }
              );
            } else {
              // Patient found, use the existing patient ID
              const patientId = results[0].patient_id;

              const appointmentValues = values.map((value) => [
                patientId,
                ...value,
              ]);

              const appointmentSql =
                "INSERT INTO appointment (patient_id, doctor_id, patient_phone, patient_type, appointment_timestamp, appointment_time, status, patient_location, FDE_Name, note) VALUES ?";
              tempCon.query(
                appointmentSql,
                [appointmentValues],
                async function (error, result) {
                  tempCon.release();
                  if (error) {
                    return reject(error);
                  }

                  try {
                    // Await the addNote function
                    await addNote(appointments);
                    console.log("WHATSAPP VALUES PARAMETERS:", values);
                    await sendWhatsAppMsg(
                      `+91${values[0][1]}`,
                      values[0][0],
                      values[0][3],
                      values[0][4],
                      location,
                      values[0][7]
                    );
                    resolve("Appointment and note added!");
                  } catch (noteError) {
                    console.error("Failed to add note:", noteError);
                    // Decide how to handle the note error
                    resolve("Appointment added, but failed to add note!");
                  }
                }
              );
            }
          }
        );
      }
    });
  });
}

const sendWhatsAppMsg = async (
  patientPhone,
  branchDoctor,
  appoDate,
  appoTime,
  branchLocation,
  fdName
) => {
  const doctor = await getDoctorById(branchLocation, branchDoctor);

  if (!doctor) return false;
  const doctorName = doctor[0].name;
  console.log(doctorName);
  // Define the start and end time
  const startTime = new Date(`1970-01-01T${appoTime}:00`).toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" }
  );
  const endTime = new Date(
    new Date(`1970-01-01T${appoTime}:00`).getTime() + 60 * 60 * 1000
  ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const timeRange = `${startTime} to ${endTime}`;

  // Branch location details (same as the PHP function)
  let branchaddress = "";
  let helpline = "";
  let googlemap = "";

  switch (branchLocation) {
    case "DP Road":
      branchaddress =
        "Ground Floor, Millenium Star Extension, Adjacent to Ruby Hall Entrance Gate, Dhole Patil Road, Pune, Maharashtra 411001";
      helpline = "8888288884";
      googlemap = "https://goo.gl/maps/5hV85GqaVfSCRejC7";
      break;
    case "Tilak Road":
      branchaddress =
        "Mangalmurti Complex, 105, First floor, Near Hirabaug, Tilak Road,Pune - 411002";
      helpline = "8888288884";
      googlemap = "https://maps.app.goo.gl/ZLiwZr5aLUwU8XdPA";
      break;
    case "Salunkhe-Vihar":
      branchaddress =
        "101/102 Girme Towers, Salunkhe Vihar Road,Next to HDFC Bank, Opp. Kotak Mahindra Bank,Oxford Village, Kedari Nagar, Wanowrie,Pune, Maharashtra 411004";
      helpline = "8888522226";
      googlemap = "https://maps.app.goo.gl/cnDzyEFSiDBqVxXs8";
      break;
    case "Baner":
      branchaddress =
        "1st floor, Crystal Empire Building, Opposite Hotel Sadanand, Next to Amar Business Park, Baner Road, Pune, Maharashtra 411045";
      helpline = "8888622221";
      googlemap = "https://goo.gl/maps/7yBP3kPn2C9jtNwz6";
      break;
    case "Pimpri-Chinchwad":
      branchaddress =
        "Second floor, Premier Plaza,Near Big Bazar & Big Cinema,Above Mac Donald, Chinchwad, Pune - 411019";
      helpline = "8888200004";
      googlemap = "https://maps.app.goo.gl/wXetuZV9sFqxhebn7";
      break;
    case "Chakan":
      branchaddress =
        "1st Floor,Gokul Complex,Near HDFC Bank, Wage Vasti Nashik Road, Chakan, Pune -410501 Tal : Khed , Dist: Pune";
      helpline = "8888596666";
      googlemap = "https://goo.gl/maps/cNdvDPK2sqTM9Rwp9";
      break;
    case "Dighi":
      branchaddress =
        "Sr No.123, Amrutdhara Commercial Hub,Alandi Rd, next to Sai Mandir, Wadmukhwadi,Charholi Budruk, Pune, Maharashtra 412105.";
      helpline = "8483999588";
      googlemap = "https://maps.app.goo.gl/9wNEDTMtG3qwtsYLA";
      break;
    case "Undri":
      branchaddress =
        "2nd floor 220, Healing hands clinic,Marvel sangria, NIBM Rd, Mohammed Wadi,Pune, Maharashtra 411060";
      helpline = "8888522226";
      googlemap = "https://maps.app.goo.gl/YPi5Fd455tjsTRLP6";
      break;
    case "Hinjewadi":
      branchaddress =
        "Healing Hands Clinic, AH Infotech,3rd Floor,Above. SBI MIDC Hinjewadi Branch, Hinjewadi Phase 1 Rd,Hinjawadi, Pune, Maharashtra 411057";
      helpline = "9175232340";
      googlemap = "https://maps.app.goo.gl/E75SswJ4EJTY9JK27";
      break;
    case "Vashi":
      branchaddress =
        "Unit no 18 at Palm Beach Galleria,1st Floor, Palm Beach Road, Vashi,New Mumbai - 400703";
      helpline = "9175232308";
      googlemap = "";
      break;
    case "Navi-Mumbai":
      branchaddress =
        "5, Gahlot Majesty sector 46A,Opp NRI Colony, Palm Beach Road,Navi Mumbai - 400706";
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
      branchaddress =
        "Cosmos Jewels, 3rd floor,Ghodbunder Rd, near Dmart,opp. Muchhala College, Parkwoods,Thane West, Thane, Maharashtra 400615";
      helpline = "8575999994";
      googlemap = "https://maps.app.goo.gl/tcGBRcV72VmSv4Zq6";
      break;
    case "Andheri":
      branchaddress =
        "B-3 ,C-4 1st floor, Mayfair Meridien HSG Society, Ceasar Rd, opp. St Blais Church, Amboli, Andheri West, Mumbai, Maharashtra 400058.";
      helpline = "9156634201";
      googlemap = "https://goo.gl/maps/PaupXzJFyVpEauG88";
      break;
    case "Nashik":
      branchaddress =
        "3rd floor, Above MacDonald Opp. Big Bazaar, College road, Nashik Maharashtra - 422005";
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
      branchaddress =
        "MG Rd, opp. LDCC Bank, Sawe Wadi, Latur, Maharashtra 413512";
      helpline = "8956223459";
      googlemap = "https://goo.gl/maps/m5W9qXUGEAkE1p6BA";
      break;
    case "Lucknow":
      branchaddress =
        "L-2/761, Vinay Khand 2, Gomti Nagar, Lucknow, Uttar Pradesh 226010";
      helpline = "";
      googlemap = "";
      break;
    case "Bangalore":
      branchaddress =
        "Krishna towers, #281,Ground floor,15th Cross Rd, 5th Phase, KR Layout, JP Nagar Phase 6, JP Nagar, Bengaluru, Karnataka - 560078";
      helpline = "8888133338";
      googlemap = "https://goo.gl/maps/mZye2mYQt9inHV3F8";
      break;
    case "Indiranagar":
      branchaddress =
        "3rd Floor Krishvi Aspire, #516,Chinmaya Mission Hospital Rd, opp.Nature's Basket, Indiranagar, Bengaluru, Karnataka 560038";
      helpline = "8197978641";
      googlemap = "https://goo.gl/maps/9xHENbGGTb4C9guC8";
      break;
    case "Sahakarnagar":
      branchaddress =
        "1st Floor, 490/8, above McDonalds,F Block, Sahakar Nagar,Byatarayanapura, Bengaluru,Karnataka 560092.";
      helpline = "9731118056";
      googlemap = "https://goo.gl/maps/fKx2Z5iRAuEQFugTA";
      break;
    case "Belagavi":
      branchaddress =
        "C/O Sbg hospital, Opposite federal bank, Ganeshpur Rd, Laxmi Tek, Belagavi, Karnataka 590001.";
      helpline = "8600002156";
      googlemap = "https://maps.app.goo.gl/qnLx7Yc8VZJHeVsa7";
      break;
    case "Hyderabad":
      branchaddress =
        "MCH No.8-2-293/82/A/729/1/1F1,1st Floor, DK's  Kavya House Road No.36, Opposite Neeru's Emporio, Madhapur Metro station Piller number 1698, Beside Indian oil petrol pump,Jubilee Hills Main Road, Jubilee Hills,Hyderabad, Telangana";
      helpline = "7680862049";
      googlemap = "https://goo.gl/maps/ouqsC1e5AA11EBhR7";
      break;
    case "Ludhiana":
      branchaddress =
        "2117/1457, Gobind Nagar, Opp. hotel onn, Near Yes Bank, Ferozepur Road, Ludhiana, Punjab 141001.";
      helpline = "7986935908";
      googlemap = "https://goo.gl/maps/B6GboeLp3bWrLn2U7";
      break;
    case "Delhi":
      branchaddress =
        "3rd floor, Building No- 2, Above Noida Meat Shop, Sector 110 Noida, Delhi NCR";
      helpline = "9152655877";
      googlemap = "https://goo.gl/maps/CfcA1JeYY41wrUhu9";
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
    template_name: "appointment_msg_1",
    parameters: [
      { name: "address", value: branchaddress },
      { name: "doctor_name", value: doctorName },
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

    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
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

module.exports = { addAppointment };
