const { createPool } = require("../../dbconfig");

// Define your database connections
const conDP = createPool("hmsDPDB");
const conAndheri = createPool("hmsAndheriDB");
const conBaner = createPool("hmsBanerDB");
const conBangalore = createPool("hmsBangaloreDB");
const conBelgavi = createPool("hmsBelagaviDB");
const conChakan = createPool("hmsChakanDB");
const conDighi = createPool("hmsDighiDB");
const conGurgaon14 = createPool("hmsGurgaon14DB");
const conGurgaon49 = createPool("hmsGurgaon49DB");
const conHSR = createPool("hmsHSRDB");
const conHyderabad = createPool("hmsHyderabadDB");
const conIndiranagar = createPool("hmsIndiranagarDB");
const conIndore = createPool("hmsIndoreDB");
const conkc = createPool("hmskcDB");
const conKolhapur = createPool("hmsKolhapurDB");
const conLatur = createPool("hmsLaturDB");
const conLudhiana = createPool("hmsLudhianaDB");
const conMysore = createPool("hmsMysoreDB");
const conNashik = createPool("hmsNashikDB");
const conNM = createPool("hmsNMDB");
const conPC = createPool("hmsPCDB");
const conSahakarnagar = createPool("hmsSahakarnagarDB");
const conSecunderabad = createPool("hmsSecunderabadDB");
const conSurat = createPool("hmsSuratDB");
const conSV = createPool("hmsSVDB");
const conThane = createPool("hmsThaneDB");
const conTilakroad = createPool("hmsTilakroadDB");
const conUndri = createPool("hmsUndriDB");
const conVashi = createPool("hmsVashiDB");
const conHinjewadi = createPool("hmsHinjewadiDB");
const conLucknow = createPool("hmsLucknowDB");
const conKalaburagi = createPool("hmsKalaburagiDB");
const conRajajiNagar = createPool("hmsRajajinagarDB");
const conSarjapura = createPool("hmsSarjapuraDB");
const conKatraj = createPool("hmsKatrajDB");
const conLead = createPool("hhc_appointments");
const conTest = createPool("medixpress-demo");
const conAhmedabad = createPool("hmsAhmedabadDB");
const conMohali = createPool("hmsMohaliDB");
const conAurangabad = createPool("hmsAurangabadDB");
const conWhitefield = createPool("hmsWhitefieldDB");
const conHadapsar = createPool("hmsHadapsarDB");
const conKalyan = createPool("hmsKalyanDB");
const conBopal = createPool("hmsBopalDB");
const conElectroniccity = createPool("hmsElectroniccityDB");
const conRRNagar = createPool("hmsRRNagarDB");
const conAdajan = createPool("hmsAdajanDB");
const conRaipur = createPool("hmsRaipurDB");
const conKalyanNagar = createPool("hmsKalyanNagarDB");

const providerMap = {
  C08RV: { locationName: "Test", connection: conTest },
  C44OA: { locationName: "Hyderabad", connection: conHyderabad },
  HHC102: { locationName: "DP Road", connection: conDP },
  C44NT: { locationName: "Surat", connection: conSurat },
  C41PG: { locationName: "Ludhiana", connection: conLudhiana },
  C45PF: { locationName: "Indiranagar", connection: conIndiranagar },
  C45MY: { locationName: "Dighi", connection: conDighi },
  C44Q9: { locationName: "Thane", connection: conThane },
  C44O8: { locationName: "Belagavi", connection: conBelgavi },
  C45NN: { locationName: "HSR", connection: conHSR },
  C0NVG: { locationName: "Bangalore", connection: conBangalore },
  C44QA: { locationName: "Navi-Mumbai", connection: conNM },
  C41HZ: { locationName: "Pimpri-Chinchwad", connection: conPC },
  C44NO: { locationName: "Nashik", connection: conNashik },
  C41GW: { locationName: "Salunkhe-Vihar", connection: conSV },
  C419F: { locationName: "Chakan", connection: conChakan },
  C415V: { locationName: "Baner", connection: conBaner },
  HHC117: { locationName: "Kolhapur", connection: conKolhapur },
  C41JV: { locationName: "Secunderabad", connection: conSecunderabad },
  C44QH: { locationName: "Andheri", connection: conAndheri },
  C45S6: { locationName: "Sahakarnagar", connection: conSahakarnagar },
  C4768: { locationName: "Gurgaon-14", connection: conGurgaon14 },
  C4CVG: { locationName: "Gurgaon-49", connection: conGurgaon49 },
  HHC123: { locationName: "Kemps-Corner", connection: conkc },
  HHC124: { locationName: "Latur", connection: conLatur },
  HHC125: { locationName: "Indore", connection: conIndore },
  C42FD: { locationName: "Mysore", connection: conMysore },
  C47A6: { locationName: "Undri", connection: conUndri },
  C44OC: { locationName: "Vashi", connection: conVashi },
  C4C2U: { locationName: "Hinjewadi", connection: conHinjewadi },
  C3KKO: { locationName: "Lucknow", connection: conLucknow },
  HHC131: { locationName: "Kalaburagi", connection: conKalaburagi },
  C2H33: { locationName: "Rajaji Nagar", connection: conRajajiNagar },
  C3HDG: { locationName: "Sarjapura", connection: conSarjapura },
  C419D: { locationName: "Katraj", connection: conKatraj },
  HHC135: { locationName: "Lead", connection: conLead },
  C419B: { locationName: "Ahmedabad", connection: conAhmedabad },
  C41H6: { locationName: "Mohali", connection: conMohali },
  C43N1: { locationName: "Aurangabad", connection: conAurangabad },
  C45UP: { locationName: "Whitefield", connection: conWhitefield },
  C45U2: { locationName: "Hadapsar", connection: conHadapsar },
  C493A: { locationName: "Kalyan", connection: conKalyan },
  HHC139: { locationName: "Bopal", connection: conBopal },
  C4AO7: { locationName: "Electronic City", connection: conElectroniccity },
  C4DK3: { locationName: "Adajan", connection: conAdajan },
  C4D4S: { locationName: "RR Nagar", connection: conRRNagar },
  C4EDC: { LocationName: "Raipur", connection: conRaipur },
  HHC140: { LocationName: "Kalyan Nagar", connection: conKalyanNagar },
};

const getConnectionByProviderId = (providerId) => {
  const entry = providerMap[providerId];

  if (entry) {
    return { connection: entry.connection, location: entry.locationName };
  } else {
    return { connection: null, location: null };
  }
};

async function saveInvoice(chemist_code, invoiceData) {
  const { connection } = getConnectionByProviderId(chemist_code);

  if (!connection) {
    throw new Error("Invalid chemist_code / Provider");
  }

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      const query = `
        INSERT INTO evital_pharmacy_invoice (order_id, invoice_details)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          invoice_details = VALUES(invoice_details),
          updated_at = CURRENT_TIMESTAMP
      `;

      const params = [invoiceData.order_number, JSON.stringify(invoiceData)];

      tempCon.query(query, params, (error, result) => {
        tempCon.release();

        if (error) return reject(error);
        resolve(result);
      });
    });
  });
}

async function savePaymentUpdate(chemist_code, paymentData) {
  const { connection } = getConnectionByProviderId(chemist_code);

  if (!connection) {
    throw new Error("Invalid chemist_code / Provider");
  }

  const transactionIdsNumbers =
    paymentData.transaction_summary?.transaction_ids_numbers ?? [];

  if (transactionIdsNumbers.length === 0) {
    throw new Error(
      "No transaction_ids_numbers found in payment_update payload",
    );
  }

  // Only use the first order_number
  const orderNumber = transactionIdsNumbers[0].order_number;

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      const query = `
        UPDATE evital_pharmacy_invoice
        SET
          UpdatedInvoiceDetails = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
      `;

      const params = [JSON.stringify(paymentData), orderNumber];

      tempCon.query(query, params, (error, result) => {
        tempCon.release();

        if (error) return reject(error);

        if (result.affectedRows === 0) {
          console.warn(
            "Payment update: no matching invoice found for order_number:",
            orderNumber,
          );
        }

        resolve(result);
      });
    });
  });
}

async function updateInvoice(chemist_code, invoiceData) {
  const { connection } = getConnectionByProviderId(chemist_code);

  if (!connection) {
    throw new Error("Invalid chemist_code / Provider");
  }

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      const query = `
        UPDATE evital_pharmacy_invoice
        SET
          invoice_details = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
      `;

      const params = [JSON.stringify(invoiceData), invoiceData.order_number];

      tempCon.query(query, params, (error, result) => {
        tempCon.release();

        if (error) return reject(error);

        if (result.affectedRows === 0) {
          console.warn(
            "Invoice edit: no matching invoice found for order_number:",
            invoiceData.order_number,
          );
        }

        resolve(result);
      });
    });
  });
}

module.exports = {
  saveInvoice,
  savePaymentUpdate,
  updateInvoice,
};
