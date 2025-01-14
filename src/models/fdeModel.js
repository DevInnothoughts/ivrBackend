const { getConnectionByLocation } = require("../../databaseUtils");

async function getFDEs(location) {
  const { connection } = getConnectionByLocation(location);
  if (!connection) {
    const err = new Error("Invalid location", location);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      tempCon.query(
        "SELECT FDEID, FDEName FROM fdedetails WHERE is_deleted != 1 ORDER BY FDEID ASC",
        function (error, rows, fields) {
          tempCon.release();
          if (error) {
            return reject(error);
          }
          console.log(rows);
          resolve(rows);
        }
      );
    });
  });
}

module.exports = { getFDEs };
