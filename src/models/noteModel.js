const { getConnectionByLocation } = require("../../databaseUtils");

async function addNote(appointments) {
  const { connection } = getConnectionByLocation(
    appointments[0].patient_location
  );
  if (!connection) {
    const err = new Error("Invalid location", appointments[0].patient_location);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        tempCon.release();
        return reject(err);
      }

      var sql = `UPDATE IVRdata 
                 SET note = ?
                 WHERE call_date = ? AND call_time = ? AND caller_no = ?
                 ORDER BY ivr_id DESC
                 LIMIT 1`;
      const ivrQueryParams = [
        appointments[0].note,
        appointments[0].Call_Date,
        appointments[0].Call_Time,
        appointments[0].patient_phone,
      ];
      console.log(sql, ivrQueryParams);
      tempCon.query(sql, ivrQueryParams, function (error, result) {
        tempCon.release();
        if (error) {
          console.log("Error while adding note!");
          return reject(error);
        }
        console.log("Note Added!", result);
        resolve("Note added!");
      });
    });
  });
}

async function addCallingNote(newNote, date, enquiry_id, loc) {
  console.log("Input Parameters:", { newNote, date, enquiry_id, loc });

  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // Step 1: Fetch the existing calling_notes
      const fetchSql = `SELECT calling_notes FROM appointment_enquiry WHERE enquiry_id = ?`;
      tempCon.query(fetchSql, [enquiry_id], function (fetchError, results) {
        if (fetchError) {
          tempCon.release();
          return reject(fetchError);
        }

        // Initialize callingNotes as an empty array if null or empty
        let callingNotes = [];

        if (results.length > 0 && results[0].calling_notes) {
          try {
            callingNotes = JSON.parse(results[0].calling_notes) || [];
            console.log("Existing Calling Notes:", callingNotes);
          } catch (parseError) {
            tempCon.release();
            return reject(new Error("Invalid JSON format in calling_notes"));
          }
        } else {
          console.log(
            "No existing calling notes found, initializing as empty array."
          );
        }

        // Step 2: Append the new note to the array
        const formattedDate = new Date(date).toISOString();
        callingNotes.push({ note: newNote, date: formattedDate });

        // Step 3: Update the database with the new calling_notes array
        const updateSql = `
          UPDATE appointment_enquiry
          SET calling_notes = ?
          WHERE enquiry_id = ?
        `;

        tempCon.query(
          updateSql,
          [JSON.stringify(callingNotes), enquiry_id],
          function (updateError, result) {
            tempCon.release();
            if (updateError) {
              console.error("Error while adding calling note:", updateError);
              return reject(updateError);
            }
            console.log("Calling Note Added!", result);
            resolve({
              message: "Calling Note added!",
              updatedNotes: callingNotes,
            });
          }
        );
      });
    });
  });
}

async function addSurgeryCallingNote(newNote, date, id, loc) {
  console.log("Input Parameters:", { newNote, date, id, loc });

  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // Step 1: Fetch the existing calling_notes
      const fetchSql = `SELECT calling_notes FROM diagnosis WHERE diag_id = ?`;
      tempCon.query(fetchSql, [id], function (fetchError, results) {
        if (fetchError) {
          tempCon.release();
          return reject(fetchError);
        }

        // Initialize callingNotes as an empty array if null or empty
        let callingNotes = [];

        if (results.length > 0 && results[0].calling_notes) {
          try {
            callingNotes = JSON.parse(results[0].calling_notes) || [];
            console.log("Existing Calling Notes:", callingNotes);
          } catch (parseError) {
            tempCon.release();
            return reject(new Error("Invalid JSON format in calling_notes"));
          }
        } else {
          console.log(
            "No existing calling notes found, initializing as empty array."
          );
        }

        // Step 2: Append the new note to the array
        const formattedDate = new Date(date).toISOString();
        callingNotes.push({ note: newNote, date: formattedDate });

        // Step 3: Update the database with the new calling_notes array
        const updateSql = `
          UPDATE diagnosis
          SET calling_notes = ?
          WHERE diag_id = ?
        `;

        tempCon.query(
          updateSql,
          [JSON.stringify(callingNotes), id],
          function (updateError, result) {
            tempCon.release();
            if (updateError) {
              console.error("Error while adding calling note:", updateError);
              return reject(updateError);
            }
            console.log("Calling Note Added!", result);
            resolve({
              message: "Calling Note added!",
              updatedNotes: callingNotes,
            });
          }
        );
      });
    });
  });
}

async function addPostOpCallingNote(newNote, date, id, loc) {
  console.log("Input Parameters:", { newNote, date, id, loc });

  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // Step 1: Fetch the existing calling_notes
      const fetchSql = `SELECT calling_notes FROM discharge_card WHERE discharge_id = ?`;
      tempCon.query(fetchSql, [id], function (fetchError, results) {
        if (fetchError) {
          tempCon.release();
          return reject(fetchError);
        }

        // Initialize callingNotes as an empty array if null or empty
        let callingNotes = [];

        if (results.length > 0 && results[0].calling_notes) {
          try {
            callingNotes = JSON.parse(results[0].calling_notes) || [];
            console.log("Existing Calling Notes:", callingNotes);
          } catch (parseError) {
            tempCon.release();
            return reject(new Error("Invalid JSON format in calling_notes"));
          }
        } else {
          console.log(
            "No existing calling notes found, initializing as empty array."
          );
        }

        // Step 2: Append the new note to the array
        const formattedDate = new Date(date).toISOString();
        callingNotes.push({ note: newNote, date: formattedDate });

        // Step 3: Update the database with the new calling_notes array
        const updateSql = `
          UPDATE discharge_card
          SET calling_notes = ?
          WHERE discharge_id = ?
        `;

        tempCon.query(
          updateSql,
          [JSON.stringify(callingNotes), id],
          function (updateError, result) {
            tempCon.release();
            if (updateError) {
              console.error("Error while adding calling note:", updateError);
              return reject(updateError);
            }
            console.log("Calling Note Added!", result);
            resolve({
              message: "Calling Note added!",
              updatedNotes: callingNotes,
            });
          }
        );
      });
    });
  });
}

module.exports = {
  addNote,
  addCallingNote,
  addSurgeryCallingNote,
  addPostOpCallingNote,
};
