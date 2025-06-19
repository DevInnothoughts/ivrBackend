const { getConnectionByLocation } = require("../../databaseUtils");

async function addPatientRegForm(patient) {
  const { connection, location } = getConnectionByLocation(patient.location);
  if (!connection) {
    const err = new Error(
      `Invalid location for patient registration: ${location}`
    );
    err.status = 404;
    throw err;
  }

  // Format date properly for MySQL (YYYY-MM-DD)
  const date = new Date(patient.dateOfBirth);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedParts = formatter.formatToParts(date);
  const birthDate = formattedParts
    .filter((part) => part.type !== "literal") // removes "/" or other separators
    .map((part) => part.value)
    .join("-"); // join with hyphen

  console.log(birthDate); // → 17-05-1994
  // Safely join arrays
  const workPattern = Array.isArray(patient.workPattern)
    ? patient.workPattern.join(",")
    : "";

  const specialRequirements = Array.isArray(patient.specialRequirements)
    ? patient.specialRequirements.join(", ")
    : "";
  console.log(patient);
  // Prepare values for the UPDATE statement
  const patientValues = {
    prefix: patient.prefix || null,
    name: patient.name.toUpperCase() || null, // Uncommented this important field //make it uppercase
    sex: patient.sex || null,
    phone: patient.mobileNo ? patient.mobileNo.replace(/^0+/, "") : null, // Uncommented
    email: patient.email || null,
    companyname: patient.companyName || null,
    age: patient.age || null,
    ref: patient.referralSourceDetails || null,
    reference_type: patient.referralSource || null,
    occupation: patient.occupation || null,
    address: patient.address || null,
    pincode: patient.pincode || null,
    mobile_2: patient.alternateMobileNo || null,
    blood_group: patient.bloodGroup || null,
    birth_date: birthDate,
    specific_work: workPattern || null,
    patient_location: location,
    identity:
      patient.photoIdType && patient.photoIdNo
        ? `${patient.photoIdType},${patient.photoIdNo}`
        : null,
    additional_info: JSON.stringify({
      nationality:
        patient.nationality === "Other" ? patient.otherNationality : "India",
      //identificationMark: patient.identificationMark || null,
      language: patient.language || null,
      //specialRequirements: specialRequirements,
      //vulnerableType: patient.vulnerableGroup ? patient.vulnerableType : null,
    }),
  };

  console.log("After", patientValues);
  return new Promise((resolve, reject) => {
    connection.getConnection(async function (err, tempCon) {
      if (err) {
        return reject(new Error(`Database connection failed: ${err.message}`));
      }

      try {
        // Alternative approach with explicit field mapping for better security
        const sql = `
          UPDATE patient 
          SET 
            prefix = ?,
            name = ?,
            sex = ?,
            phone = ?,
            email = ?,
            companyname = ?,
            age = ?,
            ref = ?,
            reference_type = ?,
            occupation = ?,
            address = ?,
            pincode = ?,
            mobile_2 = ?,
            blood_group = ?,
            birth_date = ?,
            specific_work = ?,
            patient_location = ?,
            identity = ?,
            additional_info = ?
          WHERE patient_id = ?
        `;

        const values = [
          patientValues.prefix,
          patientValues.name,
          patientValues.sex,
          patientValues.phone,
          patientValues.email,
          patientValues.companyname,
          patientValues.age,
          patientValues.ref,
          patientValues.reference_type,
          patientValues.occupation,
          patientValues.address,
          patientValues.pincode,
          patientValues.mobile_2,
          patientValues.blood_group,
          patientValues.birth_date,
          patientValues.specific_work,
          patientValues.patient_location,
          patientValues.identity,
          patientValues.additional_info,
          patient.patient_id,
        ];

        //console.log("Values:", values);
        tempCon.query(sql, values, function (error, result) {
          tempCon.release();

          if (error) {
            console.error("Database error:", error);
            return reject(
              new Error(`Failed to update patient record: ${error.message}`)
            );
          }

          if (result.affectedRows === 0) {
            return reject(
              new Error("No patient record found with the provided UID")
            );
          }

          resolve(result);
        });
      } catch (error) {
        tempCon.release();
        reject(new Error(`Error preparing patient data: ${error.message}`));
      }
    });
  });
}

async function verifyPatient(data) {
  console.log(data);
  const { connection, location } = getConnectionByLocation(data.location);
  if (!connection) {
    const err = new Error(
      `Invalid location of patient registration: ${location}`
    );
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) {
        return reject(err);
      }

      const sql = `
        SELECT ap.patient_id, p.name, ap.executivechk
        FROM patient p
        JOIN appointment ap ON p.patient_id = ap.patient_id
        WHERE ap.is_deleted != 1 
        AND ap.patient_phone = ?
        AND ap.patient_type = 'New'
        AND ap.confirm_time != 0
        AND DATE(ap.appointment_timestamp) = CURDATE()
        AND p.Uid_no != '0'
        ORDER BY ap.appointment_id DESC
        LIMIT 1 
      `;

      // Normalize phone number format
      const formattedPhone = data.mobileNo
        .replace(/\D/g, "")
        .replace(/^0+/, "");
      const queryParams = [formattedPhone];

      tempCon.query(sql, queryParams, (error, results) => {
        tempCon.release();

        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }

        if (results.length === 0) {
          const notFoundError = new Error(
            "No appointment found for today with this mobile number"
          );
          notFoundError.statusText =
            "Kindly confirm your visit at receptionist desk.";
          notFoundError.status = 404;
          return resolve(notFoundError);
        }

        const result = results[0];
        console.log(result);

        if (result.executivechk === 2) {
          const completeMessage = new Error("Process already completed");
          completeMessage.statusText =
            "Your process is completed. Thank you for visiting Healing Hands Clinic.";
          completeMessage.status = 410;
          return resolve(completeMessage);
        }

        //resolve(results[0]);
        resolve({
          patient_id: result.patient_id,
          name: result.name,
        });
      });
    });
  });
}

module.exports = { addPatientRegForm, verifyPatient };
