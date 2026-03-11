const mysql = require("mysql");
const { sendNewLeadEmail } = require("../util/emailService");

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

function formatDateForMySQL(date) {
  if (!date) return null;
  const d = new Date(date);
  const pad = (n) => (n < 10 ? "0" + n : n);
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = "00"; //pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:00`;
}

async function addAction(appointments) {
  const connection = createPool("JLR");
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
  const connection = createPool("JLR");
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

async function getIvrLeads(location) {
  const connection = createPool("JLR");
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

      let query = `
        SELECT *
        FROM ivrdata 
        ORDER BY id DESC
      LIMIT 100;
      `;

      let queryParams = [];

      tempCon.query(query, queryParams, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        console.log(rows);
        resolve(rows);
      });
    });
  });
}

async function getLeads(location) {
  const connection = createPool("JLR");
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

      let query = `
        SELECT *
        FROM webleads 
        ORDER BY lead_id DESC
      LIMIT 100;
      `;

      let queryParams = [];

      tempCon.query(query, queryParams, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        console.log(rows);
        resolve(rows);
      });
    });
  });
}

async function getBotLeads(location) {
  const connection = createPool("JLR");
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

      let query = `
        SELECT *
        FROM botLeads 
        ORDER BY id DESC
      LIMIT 100;
      `;

      let queryParams = [];

      tempCon.query(query, queryParams, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        console.log(rows);
        resolve(rows);
      });
    });
  });
}

async function getMetaLeads(location) {
  const connection = createPool("JLR");
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

      let query = `
        SELECT *
        FROM facebookLeads 
        ORDER BY id DESC
      LIMIT 100;
      `;

      let queryParams = [];

      tempCon.query(query, queryParams, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        console.log(rows);
        resolve(rows);
      });
    });
  });
}

async function getSalesExecutive() {
  const connection = createPool("JLR");
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
       SELECT * FROM salesExecutive WHERE isDeleted = 0;
      `;

      tempCon.query(sql, function (error, rows, fields) {
        tempCon.release();
        if (error) {
          return reject(error);
        }
        resolve(rows);
      });
    });
  });
}

async function getStatusList() {
  const connection = createPool("JLR");
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
       SELECT statusId, statusName FROM status WHERE isDeleted = 0;
      `;

      tempCon.query(sql, function (error, rows, fields) {
        tempCon.release();
        if (error) {
          return reject(error);
        }
        resolve(rows);
      });
    });
  });
}

async function getCREList() {
  const connection = createPool("JLR");
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
       SELECT * FROM creData WHERE isDeleted = 0;
      `;

      tempCon.query(sql, function (error, rows, fields) {
        tempCon.release();
        if (error) {
          return reject(error);
        }
        resolve(rows);
      });
    });
  });
}

async function updateWebLeadV1(leadData) {
  const { id, note, statustype, salesExecutive, followUpNotes } = leadData;

  const executiveToSave =
    salesExecutive && typeof salesExecutive === "object"
      ? salesExecutive.name || salesExecutive.executiveId || null
      : salesExecutive || null;

  const connection = createPool("JLR");
  if (!connection) {
    const err = new Error("Invalid location");
    console.log(err.status);
    err.status = 404;
    throw err;
  }

  const newFollowupEntry = {
    date: new Date().toISOString().slice(0, 19).replace("T", " "),
    note: note || "",
    executive: executiveToSave,
  };

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      const sql = `
        UPDATE webleads
       SET 
        Comment = ?, 
        Status = ?, 
        salesExecutive = ?,
        followupnotes = 
            CASE
              WHEN JSON_VALID(followupnotes) THEN JSON_ARRAY_APPEND(followupnotes, '$', CAST(? AS JSON))
              ELSE JSON_ARRAY(CAST(? AS JSON))
            END
        WHERE lead_id = ?
      `;

      const newNoteJSON = JSON.stringify(newFollowupEntry);

      tempCon.query(
        sql,
        [note, statustype, executiveToSave, newNoteJSON, newNoteJSON, id],
        (error, result) => {
          tempCon.release();
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });
}

async function updateWebLeadV2(leadData) {
  const { id, note, statustype, salesExecutive, callBackDate } = leadData;

  const leadId = id;
  const isNoteEmpty = !note || String(note).trim() === "";

  const executiveToSave =
    salesExecutive && typeof salesExecutive === "object"
      ? salesExecutive.name || salesExecutive.executiveId || null
      : salesExecutive || null;

  const connection = createPool("JLR");
  if (!connection) throw new Error("Invalid database connection pool for JLR");

  const newFollowupEntry = {
    date: new Date().toISOString().slice(0, 19).replace("T", " "),
    note: String(note).trim() || "",
    executive: executiveToSave,
  };
  const newNoteJSON = JSON.stringify(newFollowupEntry);

  const fetchDetailsQuery = `
    SELECT 
      CONCAT(wl.firstname, ' ', wl.lastname) AS leadName,
      wl.phoneno AS leadPhone,
      wl.salesExecutive AS currentExecutiveName,
      se.email AS executiveEmail,
      se.name AS executiveName
    FROM webleads wl
    LEFT JOIN salesExecutive se ON se.name = ?
    WHERE wl.lead_id = ?
  `;

  return new Promise((resolve, reject) => {
    connection.getConnection(async (err, tempCon) => {
      if (err) {
        console.error("Database connection error:", err);
        return reject(err);
      }

      try {
        const [leadDetails] = await new Promise((res, rej) => {
          tempCon.query(
            fetchDetailsQuery,
            [executiveToSave, leadId],
            (error, rows) => {
              if (error) return rej(error);
              res(rows);
            }
          );
        });

        if (!leadDetails || leadDetails.length === 0) {
          throw new Error(`Web Lead with ID ${leadId} not found.`);
        }

        const {
          currentExecutiveName,
          executiveEmail,
          executiveName,
          leadName,
          leadPhone,
        } = leadDetails;

        const isNewAssignmentOrChange =
          executiveToSave !== null && currentExecutiveName !== executiveToSave;

        const formattedCallBackDate = callBackDate
          ? formatDateForMySQL(callBackDate)
          : null;

        let updateSql = `
  UPDATE webleads
  SET 
    Comment = ?, 
    Status = ?, 
    salesExecutive = ?,
    callBackDate = ?
`;
        let queryParams = [
          note,
          statustype,
          executiveToSave,
          formattedCallBackDate,
        ];

        if (!isNoteEmpty) {
          updateSql += `,
              followupnotes = 
                  CASE
                    WHEN JSON_VALID(followupnotes) THEN JSON_ARRAY_APPEND(followupnotes, '$', CAST(? AS JSON))
                    ELSE JSON_ARRAY(CAST(? AS JSON))
                  END
            `;
          queryParams.push(newNoteJSON, newNoteJSON);
        }

        updateSql += ` WHERE lead_id = ?`;
        queryParams.push(leadId);

        await new Promise((res, rej) => {
          tempCon.query(updateSql, queryParams, (error, result) => {
            if (error) return rej(error);
            res(result);
          });
        });

        if (isNewAssignmentOrChange && executiveEmail) {
          console.log(`Sending new lead email to: ${executiveEmail}`);
          await sendNewLeadEmail({
            toEmail: executiveEmail,
            executiveName: executiveName,
            leadName: leadName,
            leadPhone: leadPhone,
            leadSource: "Web Lead",
          });
        }

        tempCon.release();
        resolve("Web lead updated successfully!");
      } catch (error) {
        tempCon.release();
        console.error(
          "Error in updateWebLeadV1 (DB or Email failed):",
          error.message
        );
        reject(error);
      }
    });
  });
}

async function updateIvrLeadV1(leadData) {
  const { sid, callername, note, statustype, salesExecutive } = leadData;
  const sidToUpdate = sid;

  const executiveToSave =
    salesExecutive && typeof salesExecutive === "object"
      ? salesExecutive.name || salesExecutive.executiveId || null
      : salesExecutive || null;

  const connection = createPool("JLR");
  if (!connection) {
    const err = new Error("Invalid location");
    console.log(err.status);
    err.status = 404;
    throw err;
  }
  const newFollowupEntry = {
    date: new Date().toISOString().slice(0, 19).replace("T", " "),
    note: note || "",
    executive: salesExecutive,
  };

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      const sql = `
        UPDATE ivrdata
        SET 
          Comment = ?, 
          Status = ?, 
          salesExecutive = ?,
          CallerName = ?, 
          followupnotes = 
            CASE
              WHEN JSON_VALID(followupnotes) THEN JSON_ARRAY_APPEND(followupnotes, '$', CAST(? AS JSON))
              ELSE JSON_ARRAY(CAST(? AS JSON))
            END
        WHERE Sid = ? 
      `;

      const newNoteJSON = JSON.stringify(newFollowupEntry);

      tempCon.query(
        sql,
        [
          note,
          statustype,
          executiveToSave,
          callername,
          newNoteJSON,
          newNoteJSON,
          sidToUpdate,
        ],
        (error, result) => {
          tempCon.release();
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });
}

async function updateIvrLeadV2(leadData) {
  const {
    sid,
    note,
    statustype,
    salesExecutive,
    callername,
    callBackDate,
    carType,
  } = leadData;
  const sidToUpdate = sid;

  const executiveToSave =
    salesExecutive && typeof salesExecutive === "object"
      ? salesExecutive.name || salesExecutive.executiveId || null
      : salesExecutive || null;

  const formattedCallBackDate = callBackDate
    ? formatDateForMySQL(callBackDate)
    : null;

  const connection = createPool("JLR");
  if (!connection) throw new Error("Invalid database connection pool for JLR");

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      const trimmedNote =
        note && String(note).trim() ? String(note).trim() : null;
      const updateCarType =
        carType !== null && carType !== undefined && carType !== "";

      // Build dynamic portion for carType
      const carTypeSQL = updateCarType ? `, carType = ?` : ``;

      if (trimmedNote) {
        const newFollowupEntry = {
          date: new Date().toISOString().slice(0, 19).replace("T", " "),
          note: trimmedNote,
          executive: executiveToSave,
        };
        const newNoteJSON = JSON.stringify(newFollowupEntry);

        const sql = `
          UPDATE ivrdata
          SET 
            Comment = ?, 
            Status = ?, 
            salesExecutive = ?,
            CallerName = ?, 
            callBackDate = ?
            ${carTypeSQL},
            followupnotes = 
              CASE
                WHEN JSON_VALID(followupnotes) THEN JSON_ARRAY_APPEND(followupnotes, '$', CAST(? AS JSON))
                ELSE JSON_ARRAY(CAST(? AS JSON))
              END
          WHERE Sid = ? 
        `;

        const params = [
          trimmedNote,
          statustype,
          executiveToSave,
          callername,
          formattedCallBackDate,
        ];

        if (updateCarType) params.push(carType);

        params.push(newNoteJSON, newNoteJSON, sidToUpdate);

        tempCon.query(sql, params, (error, result) => {
          tempCon.release();
          if (error) return reject(error);
          resolve(result);
        });
      } else {
        const sql = `
          UPDATE ivrdata
          SET 
            Comment = ?, 
            Status = ?, 
            salesExecutive = ?,
            CallerName = ?,
            callBackDate = ?
            ${carTypeSQL}
          WHERE Sid = ? 
        `;

        const params = [
          note || "",
          statustype,
          executiveToSave,
          callername,
          formattedCallBackDate,
        ];

        if (updateCarType) params.push(carType);

        params.push(sidToUpdate);

        tempCon.query(sql, params, (error, result) => {
          tempCon.release();
          if (error) return reject(error);
          resolve(result);
        });
      }
    });
  });
}

async function updateMetaLeadV1(leadData) {
  const { id, note, statustype, salesExecutive, followUpNotes } = leadData;

  const executiveToSave =
    salesExecutive && typeof salesExecutive === "object"
      ? salesExecutive.name || salesExecutive.executiveId || null
      : salesExecutive || null;

  const connection = createPool("JLR");
  if (!connection) {
    const err = new Error("Invalid location");
    console.log(err.status);
    err.status = 404;
    throw err;
  }

  const newFollowupEntry = {
    date: new Date().toISOString().slice(0, 19).replace("T", " "),
    note: note || "",
    executive: executiveToSave,
  };

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      const sql = `
        UPDATE facebookLeads
       SET 
        Comment = ?, 
        Status = ?, 
        salesExecutive = ?,
        followUpNotes = 
            CASE
              WHEN JSON_VALID(followUpNotes) THEN JSON_ARRAY_APPEND(followUpNotes, '$', CAST(? AS JSON))
              ELSE JSON_ARRAY(CAST(? AS JSON))
            END
        WHERE id = ?
      `;

      const newNoteJSON = JSON.stringify(newFollowupEntry);

      tempCon.query(
        sql,
        [note, statustype, executiveToSave, newNoteJSON, newNoteJSON, id],
        (error, result) => {
          tempCon.release();
          if (error) return reject(error);

          console.log("Meta lead updated:", result);
          resolve(result);
        }
      );
    });
  });
}

async function updateMetaLeadV2(leadData) {
  const { id, note, statustype, salesExecutive, callBackDate } = leadData;
  const isNoteEmpty = !note || String(note).trim() === "";

  const executiveToSave =
    salesExecutive && typeof salesExecutive === "object"
      ? salesExecutive.name || salesExecutive.executiveId || null
      : salesExecutive || null;

  const connection = createPool("JLR");
  if (!connection) throw new Error("Invalid DB connection pool");

  const newFollowupEntry = {
    date: new Date().toISOString().slice(0, 19).replace("T", " "),
    note: String(note).trim() || "",
    executive: executiveToSave,
  };
  const newNoteJSON = JSON.stringify(newFollowupEntry);

  let sql = `
    UPDATE facebookLeads
    SET 
      Comment = ?, 
      Status = ?, 
      salesExecutive = ?,
      callBackDate = ?
  `;
  const formattedCallBackDate = callBackDate
    ? formatDateForMySQL(callBackDate)
    : null;
  let queryParams = [note, statustype, executiveToSave, formattedCallBackDate];

  if (!isNoteEmpty) {
    sql += `,
      followupnotes = 
        CASE
          WHEN JSON_VALID(followupnotes) THEN JSON_ARRAY_APPEND(followupnotes, '$', CAST(? AS JSON))
          ELSE JSON_ARRAY(CAST(? AS JSON))
        END
    `;
    queryParams.push(newNoteJSON, newNoteJSON);
  }

  sql += ` WHERE id = ?`;
  queryParams.push(id);

  try {
    return new Promise((resolve, reject) => {
      connection.getConnection((err, tempCon) => {
        if (err) return reject(err);

        tempCon.query(sql, queryParams, (error, result) => {
          tempCon.release();
          if (error) return reject(error);

          console.log("Meta lead updated:", result);
          resolve(result);
        });
      });
    });
  } catch (error) {
    throw error;
  }
}

async function updateBotLeadV1(leadData) {
  const { id, note, statustype, salesExecutive, followUpNotes } = leadData;

  const executiveToSave =
    salesExecutive && typeof salesExecutive === "object"
      ? salesExecutive.name || salesExecutive.executiveId || null
      : salesExecutive || null;

  const connection = createPool("JLR");
  if (!connection) {
    const err = new Error("Invalid location");
    console.log(err.status);
    err.status = 404;
    throw err;
  }

  const newFollowupEntry = {
    date: new Date().toISOString().slice(0, 19).replace("T", " "),
    note: note || "",
    executive: executiveToSave,
  };

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      const sql = `
        UPDATE botLeads
       SET 
        comment = ?, 
        status = ?, 
        salesExecutive = ?,
        followUpNotes = 
            CASE
              WHEN JSON_VALID(followUpNotes) THEN JSON_ARRAY_APPEND(followUpNotes, '$', CAST(? AS JSON))
              ELSE JSON_ARRAY(CAST(? AS JSON))
            END
        WHERE id = ?
      `;

      const newNoteJSON = JSON.stringify(newFollowupEntry);

      tempCon.query(
        sql,
        [note, statustype, executiveToSave, newNoteJSON, newNoteJSON, id],
        (error, result) => {
          tempCon.release();
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });
}

async function updateBotLeadV2(leadData) {
  const { id, note, statustype, salesExecutive, callBackDate } = leadData;
  const isNoteEmpty = !note || String(note).trim() === "";

  const formattedCallBackDate = callBackDate
    ? formatDateForMySQL(callBackDate)
    : null;

  const executiveToSave =
    salesExecutive && typeof salesExecutive === "object"
      ? salesExecutive.name || salesExecutive.executiveId || null
      : salesExecutive || null;

  const connection = createPool("JLR");
  if (!connection) throw new Error("Invalid database connection pool for JLR");

  const newFollowupEntry = {
    date: new Date().toISOString().slice(0, 19).replace("T", " "),
    note: String(note).trim() || "",
    executive: executiveToSave,
  };

  const newNoteJSON = JSON.stringify(newFollowupEntry);

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      let sql = `
        UPDATE botLeads
        SET 
         Comment = ?, 
          Status = ?, 
          salesExecutive = ?,
          callBackDate= ?
      `;
      let queryParams = [
        note,
        statustype,
        executiveToSave,
        formattedCallBackDate || null,
      ];

      if (!isNoteEmpty) {
        sql += `,
            followupnotes = 
              CASE
                WHEN JSON_VALID(followupnotes) THEN JSON_ARRAY_APPEND(followupnotes, '$', CAST(? AS JSON))
                ELSE JSON_ARRAY(CAST(? AS JSON))
              END
          `;
        queryParams.push(newNoteJSON, newNoteJSON);
      }

      sql += ` WHERE id = ?`;
      queryParams.push(id);

      tempCon.query(sql, queryParams, (error, result) => {
        tempCon.release();
        if (error) return reject(error);
        resolve(result);
      });
    });
  });
}

async function uploadJLRCallLogs(callLogs, mobile, location) {
  const connection = createPool("JLR");

  if (!connection) {
    const error = new Error(`Invalid location: JLR`);
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

module.exports = {
  addAction,
  getIvrLeads,
  getRecords,
  getLeads,
  getBotLeads,
  getMetaLeads,
  getSalesExecutive,
  getStatusList,
  getCREList,
  updateWebLeadV1,
  updateIvrLeadV1,
  updateMetaLeadV1,
  updateBotLeadV1,
  updateWebLeadV2,
  updateBotLeadV2,
  updateMetaLeadV2,
  updateIvrLeadV2,
  uploadJLRCallLogs,
};
