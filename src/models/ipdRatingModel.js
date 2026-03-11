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

const getIPDBillsV2 = async (req) => {
  const { connection, location } = getConnectionByLocation(req.query.location);

  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  const { from, to, status = "" } = req.query;
  const hasStatusFilter = status && status.trim() !== "";

  try {
    // Main query
    const rows = await new Promise((resolve, reject) => {
      connection.getConnection((err, tempCon) => {
        if (err) return reject(err);

        let sql = `
          SELECT 
              i.invoice_id,
              i.patient_id,
              i.creation_date AS admission_date,
              i.due_date AS discharge_date,
              p.name,
              p.phone,
              p.sex,
              i.discount,
              i.status,
              i.payable_amt,
              i.totalamt,
              i.totaldue,
              i.ratingInfo,
              COALESCE(SUM(
                  COALESCE(ip.cashamt, 0) + 
                  COALESCE(ip.cardamt, 0) + 
                  COALESCE(ip.chequeamt, 0) + 
                  COALESCE(ip.onlineamt, 0)
              ), 0) AS collection
          FROM invoice i
          JOIN patient p ON i.patient_id = p.patient_id
          LEFT JOIN ipd_payment ip ON i.invoice_id = ip.invoice_id
          WHERE i.creation_date >= ?  
            AND i.creation_date <= ?
            AND i.is_deleted != 1
        `;

        const queryParams = [from, to];

        if (hasStatusFilter) {
          sql += ` AND i.status = ?`;
          queryParams.push(status);
        }

        sql += `
          GROUP BY 
              i.invoice_id, i.patient_id, p.name, p.phone, p.sex, 
              i.discount, i.status, i.payable_amt, i.totalamt, i.totaldue
        `;

        tempCon.query(sql, queryParams, (error, result) => {
          tempCon.release();
          if (error) return reject(error);
          resolve(result);
        });
      });
    });

    return {
      ipdBills: rows,
    };
  } catch (error) {
    console.error("Error in getIPDBillsV2:", error);
    throw error;
  }
};

const updateRatings = async (req) => {
  const { connection, location } = getConnectionByLocation(req.body.location);

  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  const { patient_id, invoice_id, details } = req.body;

  console.log("Update Ratings Body:", req.body);
  // basic validation
  if (!patient_id || !invoice_id) {
    return res.status(400).json({
      isSuccess: false,
      errorMessage: "Missing required fields: patient_id or invoice_id",
    });
  }

  try {
    // Main query
    // Convert details object to JSON string for DB storage
    const ratingInfo = JSON.stringify(details);

    const rows = await new Promise((resolve, reject) => {
      connection.getConnection((err, tempCon) => {
        if (err) return reject(err);

        let sql = `
          UPDATE invoice SET ratingInfo = ? WHERE patient_id = ? AND invoice_id = ?
        `;

        const queryParams = [ratingInfo, patient_id, invoice_id];

        tempCon.query(sql, queryParams, (error, result) => {
          tempCon.release();
          if (error) return reject(error);
          resolve(result);
        });
      });
    });
  } catch (error) {
    console.error("Error in update ratings:", error);
    throw error;
  }
};

module.exports = { getDoctors, getDoctorById, getIPDBillsV2, updateRatings };
