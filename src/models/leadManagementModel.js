const { getConnectionByLocation } = require("../../databaseUtils");

async function getLeads(location) {
  const { connection } = getConnectionByLocation("lead");
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

      let query = `
        SELECT *
        FROM appointments 
        WHERE selected_area LIKE CONCAT('%', ?, '%') 
        ORDER BY appointment_id DESC
        LIMIT 100
      `;

      let queryParams = [location];

      if (location === "DP Road") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area LIKE CONCAT('%', 'Tilak Road', '%')
            OR selected_area LIKE CONCAT('%', 'Dhole Patil Road', '%')
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }
      if (location === "Salunke Vihar") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area LIKE CONCAT('%', 'Wanowrie', '%')
            OR selected_area LIKE CONCAT('%', 'Salunkhe Vihar', '%')
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }
      if (location === "Hinjewadi") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area LIKE CONCAT('%', 'Hinjawadi', '%')
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }
      if (location === "JP Nagar") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area = 'Bengaluru'
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }
      if (location === "Sarjapura") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area LIKE CONCAT('%', 'Sarjapur', '%')
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }
      if (location === "Rajaji Nagar") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area LIKE CONCAT('%', 'Rajajinagar', '%')
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }
      if (location === "Belgavi") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area LIKE CONCAT('%', 'Belagavi', '%')
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }
      if (location === "Sahakar Nagar") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area LIKE CONCAT('%', 'Sahakarnagar', '%')
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }
      if (location === "Gurgaon Sector 14") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area LIKE CONCAT('%', 'Gurugram - Sector 14', '%')
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }
      if (location === "Gurgaon Sector 49") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area LIKE CONCAT('%', 'Gurugram - Sector 49', '%')
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }
      if (location === "Thane") {
        query = `
          SELECT *
          FROM appointments 
          WHERE (
            selected_area LIKE CONCAT('%', ?) 
            OR selected_area LIKE CONCAT('%', 'Kapurbawdi', '%')
          )
          ORDER BY appointment_id DESC
          LIMIT 100
        `;
      }

      tempCon.query(query, queryParams, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }
        rows.forEach((row) => {
          row.selected_area = location;
        });
        //console.log(rows);
        resolve(rows);
      });
    });
  });
}

async function updateStatus(id, status, note) {
  const { connection } = getConnectionByLocation("lead");
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

      const query = `
        UPDATE appointments
        SET status = ?, note = ?
        WHERE appointment_id = ?
      `;

      tempCon.query(query, [status, note, id], function (error, rows) {
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

async function getChatBotLeads(location) {
  const { connection } = getConnectionByLocation("lead");
  if (!connection) {
    const err = new Error("Invalid location", location);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) return reject(err);

      let query = `
        SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
        FROM chatbot_leads 
        WHERE (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%'))
        ORDER BY id DESC
        LIMIT 100
      `;
      let queryParams = [location, location];

      if (location === "DP Road") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch LIKE '%Tilak Road%' OR chat_whatsapp_branch LIKE '%Tilak Road%')
            OR (branch LIKE '%Dhole Patil Road%' OR chat_whatsapp_branch LIKE '%Dhole Patil Road%')
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }

      if (location === "Salunke Vihar") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch LIKE '%Salunkhe Vihar%' OR chat_whatsapp_branch LIKE '%Salunke Vihar%' OR chat_whatsapp_branch LIKE '%Salunkhe Vihar%') 
            OR (branch LIKE '%Wanowrie%' OR chat_whatsapp_branch LIKE '%Wanowrie%')
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }

      if (location === "Hinjewadi") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch LIKE '%Hinjawadi%' OR chat_whatsapp_branch LIKE '%Hinjawadi%')
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }

      if (location === "HSR") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch LIKE '%HSR Layout%' OR chat_whatsapp_branch LIKE '%HSR Layout%')
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }

      if (location === "Rajaji Nagar") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch LIKE '%Rajajinagar%' OR chat_whatsapp_branch LIKE '%Rajajinagar%')
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }

      if (location === "Belgavi") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch LIKE '%Belagavi%' OR chat_whatsapp_branch LIKE '%Belagavi%')
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }

      if (location === "Hyderabad") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch LIKE '%Jubilee Hills%' OR chat_whatsapp_branch LIKE '%Jubilee Hills%')
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }

      if (location === "Gurgaon Sector 14") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch LIKE '%Gurugram - Sector 14%' OR chat_whatsapp_branch LIKE '%Gurugram - Sector 14%')
             OR (branch LIKE '%Gurgaon Sector - 14%' OR chat_whatsapp_branch LIKE '%Gurgaon Sector - 14%')
            
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }

      if (location === "Gurgaon Sector 49") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch LIKE '%Gurugram - Sector 49%' OR chat_whatsapp_branch LIKE '%Gurugram - Sector 49%')
             OR (branch LIKE '%Gurgaon Sector - 49%' OR chat_whatsapp_branch LIKE '%Gurgaon Sector - 49%')
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }

      if (location === "Chinchwad") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno,  disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch LIKE '%Pimpri-Chinchwad%' OR chat_whatsapp_branch LIKE '%Pimpri-Chinchwad%')
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }
      if (location === "Vashi") {
        query = `
          SELECT id AS appointment_id, datetime AS date, name, branch, contact AS phoneno, disease, chat_whatsapp_branch, query AS message, status, note
          FROM chatbot_leads 
          WHERE (
            (branch LIKE CONCAT('%', ?, '%') OR chat_whatsapp_branch LIKE CONCAT('%', ?, '%')) 
            OR (branch = '' AND chat_whatsapp_branch = '')
          )
          ORDER BY id DESC
          LIMIT 100
        `;
        queryParams = [location, location];
      }

      tempCon.query(query, queryParams, function (error, rows) {
        tempCon.release();
        if (error) return reject(error);
        rows.forEach((row) => {
          if (
            location === "Vashi" &&
            row.branch === "" &&
            row.chat_whatsapp_branch === ""
          ) {
            row.message = `OTHER BRANCH -${row.message}`;
          }
          row.selected_area = location;
        });
        //console.log(rows);
        resolve(rows);
      });
    });
  });
}

async function updateStatusBot(id, status, note) {
  const { connection } = getConnectionByLocation("lead");
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

      const query = `
        UPDATE chatbot_leads
        SET status = ?, note=?
        WHERE id = ?
      `;

      tempCon.query(query, [status, note, id], function (error, rows) {
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

async function transferToBranch(id, toBranch) {
  const { connection } = getConnectionByLocation("lead");
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

      const query = `
        UPDATE chatbot_leads
        SET branch = ?
        WHERE id = ?
      `;

      tempCon.query(query, [toBranch, id], function (error, rows) {
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

/**
 * Save Sulekha Lead
 */
async function createSulekhaLead(loc, leadData) {
  const { connection } = getConnectionByLocation("lead");

  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) {
        return reject(err);
      }

      const sql = `
        INSERT INTO sulekha_leads (
          user_name,
          user_mobile,
          user_email,
          user_city,
          location,
          user_localities,
          user_comments,
          keywords,
          created_at
        )
        VALUES (?, ?, ?,?, ?, ?, ?, ?, NOW())
      `;

      const queryParams = [
        leadData.user_name,
        leadData.user_mobile,
        leadData.user_email,
        leadData.user_city || "",
        leadData.location,
        Array.isArray(leadData.user_localities)
          ? leadData.user_localities.join(", ")
          : "",
        leadData.user_comments || "",
        leadData.keywords || "",
      ];

      tempCon.query(sql, queryParams, (error, result) => {
        tempCon.release();

        if (error) {
          return reject(error);
        }

        resolve({
          lead_id: result.insertId,
        });
      });
    });
  });
}

module.exports = {
  getLeads,
  updateStatus,
  getChatBotLeads,
  updateStatusBot,
  transferToBranch,
  createSulekhaLead,
};
