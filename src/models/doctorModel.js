const { getConnectionByLocation } = require("../../databaseUtils");

async function getDoctors(loc) {
  const { connection, location } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
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

async function getDoctorById(loc, id) {
  const { connection, location } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) {
        return reject(err);
      }

      const sql = `
        SELECT name 
        FROM doctor 
        WHERE is_deleted != 1 
        AND doctor_id = ?
      `;
      const queryParams = [id]; // Using `%` wildcard for pattern matching

      tempCon.query(sql, queryParams, (error, rows) => {
        tempCon.release();
        if (error) {
          return reject(error);
        }
        console.log("DOCTOR BY ID:", rows);
        resolve(rows);
      });
    });
  });
}

module.exports = { getDoctors, getDoctorById };
