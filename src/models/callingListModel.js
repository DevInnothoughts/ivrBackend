const { getConnectionByLocation } = require("../../databaseUtils");

async function getCallingList(loc) {
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
        SELECT DISTINCT
          e.enquiry_id, 
          e.enquirytype, 
          e.patient_name, 
          e.patient_phone, 
          e.date, 
          e.note,
          e.calling_notes, 
          DATEDIFF(CURDATE(), e.date) AS days_since
        FROM 
          appointment_enquiry e
        LEFT JOIN 
          appointment a
        ON 
          e.patient_phone = a.patient_phone
        WHERE 
          e.enquirytype != 'Visited'
          AND (a.patient_phone IS NULL OR a.confirm_time = 0)
          AND DATEDIFF(CURDATE(), e.date) IN (3, 7, 15, 30) -- Only fetch specific days
        ORDER BY 
          e.enquiry_id ASC
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group data by exact days
        const groupedData = rows.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        console.log(groupedData); // Log the grouped data
        resolve(groupedData);
      });
    });
  });
}

async function getDiagnosisCallingList(loc) {
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
        SELECT DISTINCT
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          CASE 
            WHEN d.date_diagnosis >= DATE_SUB(CURDATE(), INTERVAL 3 DAY) THEN '3 days'
            WHEN d.date_diagnosis >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN '7 days'
            WHEN d.date_diagnosis >= DATE_SUB(CURDATE(), INTERVAL 15 DAY) THEN '15 days'
            WHEN d.date_diagnosis >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN '30 days'
          END AS date_group
        FROM 
          diagnosis d
        LEFT JOIN 
          patient p
        ON 
          d.patient_id = p.patient_id
        WHERE 
          d.date_diagnosis >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY 
          d.patient_id ASC;
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group the data by `date_group`
        const groupedData = rows.reduce((acc, row) => {
          if (!row.date_group) return acc;

          if (!acc[row.date_group]) {
            acc[row.date_group] = [];
          }
          acc[row.date_group].push(row);
          return acc;
        }, {});
        console.log(groupedData);
        resolve(groupedData);
      });
    });
  });
}

async function getSurgeryPatients(loc) {
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
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          DATEDIFF(CURDATE(), d.date_diagnosis) AS days_since
        FROM 
          diagnosis d
        LEFT JOIN 
          patient p
        ON 
          d.patient_id = p.patient_id
        WHERE 
          DATEDIFF(CURDATE(), d.date_diagnosis) IN (3, 7, 15, 30) -- Fetch specific days only
          AND d.diagnosisAdvice LIKE '%Surgery%'
        ORDER BY 
          d.patient_id ASC;
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group the data by `days_since`
        const groupedData = rows.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        console.log(groupedData); // Log the grouped data
        resolve(groupedData);
      });
    });
  });
}

async function getMedicationPatients(loc) {
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
        SELECT DISTINCT
        d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          DATEDIFF(CURDATE(), d.date_diagnosis) AS days_since
        FROM 
          diagnosis d
        LEFT JOIN 
          patient p
        ON 
          d.patient_id = p.patient_id
        WHERE 
          DATEDIFF(CURDATE(), d.date_diagnosis) IN (3, 7, 15, 30) -- Fetch specific days only
          AND d.diagnosisAdvice LIKE '%Medication%'
        ORDER BY 
          d.patient_id ASC;
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group the data by `days_since`
        const groupedData = rows.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        console.log(groupedData); // Log the grouped data
        resolve(groupedData);
      });
    });
  });
}

async function getIPDPatients(loc) {
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
        SELECT DISTINCT
        d.discharge_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          d.DOD,
          d.diagnosis,
          d.surgical_procedure,
          d.calling_notes,
          DATEDIFF(CURDATE(), d.DOD) AS days_since
        FROM 
          discharge_card d
        LEFT JOIN 
          patient p
        ON 
          d.patient_id = p.patient_id
        WHERE 
         DATEDIFF(CURDATE(), d.DOD) IN (3, 7, 15, 30) -- Fetch specific days only
        ORDER BY 
          d.patient_id ASC;
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group data by exact days
        const groupedData = rows.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        console.log(groupedData); // Log the grouped data
        resolve(groupedData);
      });
    });
  });
}

module.exports = {
  getCallingList,
  getDiagnosisCallingList,
  getSurgeryPatients,
  getMedicationPatients,
  getIPDPatients,
};
