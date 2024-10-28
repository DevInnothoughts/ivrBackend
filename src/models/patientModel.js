const { getConnectionByLocation } = require("../../databaseUtils");

async function getPatient(mobile, location) {
  const { connection } = getConnectionByLocation(location);
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
      console.log("Fetching Patient:", mobile, location);
      // Using parameterized query to prevent SQL injection
      const query = `SELECT name FROM patient WHERE phone = ? AND ConfirmPatient = 1 ORDER BY date DESC`;
      tempCon.query(query, [mobile], function (error, rows, fields) {
        tempCon.release();
        if (error) {
          return reject(error);
        }
        console.log("Patient Details:", rows);
        resolve(rows);
      });
    });
  });
}

module.exports = { getPatient };
