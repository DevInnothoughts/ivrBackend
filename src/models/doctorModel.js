const { getConnectionByLocation } = require("../../databaseUtils");

async function getDoctors(loc) {
  const { connection, location } = getConnectionByLocation(loc);
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

      const sql = `
        SELECT doctor_id, name 
        FROM doctor 
        WHERE is_deleted != 1 
        AND job_location LIKE ?
        ORDER BY doctor_id ASC
      `;
      const queryParams = [`%${location}%`]; // Using `%` wildcard for pattern matching

      tempCon.query(sql, queryParams, function (error, rows, fields) {
        tempCon.release();
        if (error) {
          return reject(error);
        }
        resolve(rows);
      });
    });
  });
}

module.exports = { getDoctors };
