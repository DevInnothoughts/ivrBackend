const { getConnectionByLocation } = require("../../databaseUtils");

async function uploadCallLogs(location, mobile, callLogs) {
  const { connection } = getConnectionByLocation(location);

  if (!connection) {
    const error = new Error(`Invalid location: ${location}`);
    error.status = 404;
    throw error;
  }

  try {
    return await new Promise((resolve, reject) => {
      connection.getConnection((err, tempCon) => {
        if (err) {
          console.error("Error getting database connection:", err);
          return reject(new Error("Failed to connect to the database"));
        }

        if (!Array.isArray(callLogs) || callLogs.length === 0) {
          tempCon.release();
          return reject(new Error("No call logs to insert"));
        }

        // ✅ Sort call logs in ascending order of timestamp (oldest first)
        const sortedLogs = [...callLogs].sort(
          (a, b) => Number(a.timestamp) - Number(b.timestamp)
        );

        // ✅ Prepare bulk insert data
        const values = sortedLogs.map((log) => [
          log.name || null,
          log.phoneNumber || null,
          mobile,
          log.type || null,
          log.rawType || null,
          log.duration || 0,
          log.dateTime || null,
          log.timestamp || null,
        ]);

        const sql = `
          INSERT INTO phonecalllogs 
          (name, phoneNumber, destinationNumber, type, rawType, duration, dateTime, timestamp) 
          VALUES ?
        `;

        tempCon.query(sql, [values], (queryError, result) => {
          tempCon.release();

          if (queryError) {
            console.error("Error while uploading call logs:", queryError);
            return reject(new Error("Failed to upload call logs"));
          }

          // Return timestamp of the latest (most recent) inserted log
          const lastInserted = sortedLogs[sortedLogs.length - 1];
          console.log(
            `✅ ${sortedLogs.length} call logs inserted successfully (oldest first).`
          );
          resolve(lastInserted.timestamp);
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error occurred:", error);
    throw new Error("An error occurred while uploading call logs");
  }
}

async function uploadDoctorsCallLogs(location, mobile, callLogs) {
  const { connection } = getConnectionByLocation(location);

  if (!connection) {
    const error = new Error(`Invalid location: ${location}`);
    error.status = 404;
    throw error;
  }

  try {
    return await new Promise((resolve, reject) => {
      connection.getConnection((err, tempCon) => {
        if (err) {
          console.error("Error getting database connection:", err);
          return reject(new Error("Failed to connect to the database"));
        }

        if (!Array.isArray(callLogs) || callLogs.length === 0) {
          tempCon.release();
          return reject(new Error("No call logs to insert"));
        }

        // ✅ Sort call logs in ascending order of timestamp (oldest first)
        const sortedLogs = [...callLogs].sort(
          (a, b) => Number(a.timestamp) - Number(b.timestamp)
        );

        // ✅ Prepare bulk insert data
        const values = sortedLogs.map((log) => [
          log.name || null,
          log.phoneNumber || null,
          mobile,
          log.type || null,
          log.rawType || null,
          log.duration || 0,
          log.dateTime || null,
          log.timestamp || null,
        ]);

        const sql = `
          INSERT INTO doctorsPhoneCallLogs 
          (name, phoneNumber, destinationNumber, type, rawType, duration, dateTime, timestamp) 
          VALUES ?
        `;

        tempCon.query(sql, [values], (queryError, result) => {
          tempCon.release();

          if (queryError) {
            console.error("Error while uploading call logs:", queryError);
            return reject(new Error("Failed to upload call logs"));
          }

          // Return timestamp of the latest (most recent) inserted log
          const lastInserted = sortedLogs[sortedLogs.length - 1];
          console.log(
            `✅ ${sortedLogs.length} call logs inserted successfully (oldest first).`
          );
          resolve(lastInserted.timestamp);
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error occurred:", error);
    throw new Error("An error occurred while uploading call logs");
  }
}

module.exports = { uploadCallLogs, uploadDoctorsCallLogs };
