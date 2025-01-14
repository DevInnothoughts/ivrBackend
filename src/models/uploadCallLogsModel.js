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

        const sql = `
          INSERT INTO phonecalllogs 
          (name, phoneNumber, destinationNumber, type, rawType, duration, dateTime, timestamp) 
          VALUES ?`;

        // Prepare values for bulk insertion
        const ivrQueryParams = callLogs.map((log) => [
          log.name,
          log.phoneNumber,
          mobile,
          log.type,
          log.rawType,
          log.duration,
          log.dateTime,
          log.timestamp,
        ]);

        if (ivrQueryParams.length === 0) {
          tempCon.release();
          return reject(new Error("No call logs to insert"));
        }

        tempCon.query(sql, [ivrQueryParams], (queryError, result) => {
          tempCon.release();

          if (queryError) {
            console.error("Error while uploading call logs:", queryError);
            return reject(new Error("Failed to upload call logs"));
          }

          const lastCallLog = callLogs[0];
          // Log success and retrieve the last inserted timestamp
          console.log(
            "Call logs added successfully!",
            result,
            lastCallLog.timestamp
          );
          resolve(lastCallLog.timestamp);
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error occurred:", error);
    throw new Error("An error occurred while uploading call logs");
  }
}

module.exports = { uploadCallLogs };
