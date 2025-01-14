Your identification has been saved in devsupportGitHubKeys
Your public key has been saved in devsupportGitHubKeys.pub
The key fingerprint is:
SHA256:qwg35IGP6xnWR25QQHndZ5tl3UKVEa96r7F2PDJtm/A devsupport@innothoughts.com
The key's randomart image is:
+--[ED25519 256]--+
| .o. . . ..=_|
| ... . . o +.+|
| .. o = ..|
| . . o . |
| . + . S . |
| _ = . . |
| = _ + . ..+. |
| . _ = . ++B+|
| .+ . . .\*E+|
+----[SHA256]-----+

const { getConnectionByLocation } = require("../../databaseUtils");

async function uploadCallLogs(location, mobile, callLogs) {
const { connection } = getConnectionByLocation(location);
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

      // SQL query with placeholders for bulk insert
      const sql = `INSERT INTO phonecalllogs (name, phoneNumber,destinationNumber, type, rawType, duration, dateTime, timestamp) VALUES ?`;

      // Prepare an array of arrays for the multiple insert
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

      console.log("SQL Query: ", sql);
      console.log("Params: ", ivrQueryParams);

      // Use the bulk insert by passing an array of arrays to query
      tempCon.query(sql, [ivrQueryParams], function (error, result) {
        tempCon.release();
        if (error) {
          console.log("Error while uploading call logs!", error);
          return reject(error);
        }
        console.log("Call logs Added!", result);
        resolve("Call Logs Added!");
      });
    });

});
}

module.exports = { uploadCallLogs };
