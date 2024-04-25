const { getConnectionByLocation } = require("../../databaseUtils");

async function addNote(appointments) {
  const { connection } = getConnectionByLocation(
    appointments[0].patient_location
  );
  if (!connection) {
    const err = new Error("Invalid location");
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

module.exports = { addNote };
