const mysql = require("mysql");

//Live DB Credentials
const HOST = "192.46.212.254";
const USER = "inno";
const PASSWORD = "Inno@2024";

// const HOST = "localhost";
// const USER = "root";
// const PASSWORD = "";

const createPool = (database) => {
  return mysql.createPool({
    connectionLimit: 10,
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: database,
    insecureAuth: true,
  });
};

async function addAction(appointments) {
  const connection = createPool("socialmedia");
  console.log(connection);
  if (!connection) {
    const err = new Error("Invalid location");
    console.log(err.status);
    err.status = 404;
    throw err;
  }

  const values = appointments.map((appointment) => [
    appointment.statustype,
    appointment.callername,
    appointment.note,
    appointment.sid,
  ]);
  console.log("Values:", values);

  const updatePromises = values.map((value) => {
    const [status, callername, note, sid] = value;
    return new Promise((resolve, reject) => {
      connection.getConnection(function (err, tempCon) {
        if (err) {
          if (tempCon) tempCon.release();
          return reject(err);
        }

        const sql =
          "UPDATE ivrdata SET Status = ?, CallerName = ?, Comment = ? WHERE Sid = ?";
        tempCon.query(
          sql,
          [status, callername, note, sid],
          function (error, result) {
            tempCon.release();
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        );
      });
    });
  });

  try {
    const results = await Promise.all(updatePromises);
    console.log("Action updated!");
    return "Action updated!";
  } catch (error) {
    throw error;
  } finally {
    connection.end((err) => {
      if (err) {
        console.error("Error closing the connection:", err.message);
      }
    });
  }
}

async function getRecords() {
  const connection = createPool("socialmedia");
  console.log(connection);
  if (!connection) {
    const err = new Error("Invalid location");
    console.log(err.status);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      const sql = `
        SELECT FromNumber 
        FROM ivrdata 
        WHERE StartTime >= DATE_FORMAT(NOW() ,'%Y-%m-01 00:00:00')
      `;

      tempCon.query(sql, function (error, rows, fields) {
        tempCon.release();
        if (error) {
          return reject(error);
        }
        // Extract numbers from the rows and return only the numbers
        const numbers = rows.map((row) => row.FromNumber);
        resolve(numbers);
      });
    });
  });
}

module.exports = { addAction, getRecords };
