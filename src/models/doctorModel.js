const { getConnectionByLocation } = require("../../databaseUtils");

async function getDoctors(location) {
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

      tempCon.query(
        "SELECT doctor_id, name FROM doctor WHERE is_deleted != 1 ORDER BY doctor_id ASC",
        function (error, rows, fields) {
          tempCon.release();
          if (error) {
            return reject(error);
          }
          resolve(rows);
        }
      );
    });
  });
}

module.exports = { getDoctors };
