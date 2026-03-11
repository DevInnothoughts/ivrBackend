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

const providerMap = {
  C08RV: { locationName: "Test", connection: conTest },
  HHC101: { locationName: "Hyderabad", connection: conHyderabad },
  HHC102: { locationName: "DP Road", connection: conDP },
  HHC103: { locationName: "Surat", connection: conSurat },
  C41PG: { locationName: "Ludhiana", connection: conLudhiana },
  HHC105: { locationName: "Indiranagar", connection: conIndiranagar },
  HHC106: { locationName: "Dighi", connection: conDighi },
  HHC107: { locationName: "Thane", connection: conThane },
  HHC108: { locationName: "Belagavi", connection: conBelgavi },
  HHC109: { locationName: "HSR", connection: conHSR },
  C0NVG: { locationName: "Bangalore", connection: conBangalore },
  HHC111: { locationName: "Navi-Mumbai", connection: conNM },
  C41HZ: { locationName: "Pimpri-Chinchwad", connection: conPC },
  HHC113: { locationName: "Nashik", connection: conNashik },
  C41GW: { locationName: "Salunkhe-Vihar", connection: conSV },
  C419F: { locationName: "Chakan", connection: conChakan },
  HHC116: { locationName: "Baner", connection: conBaner },
  HHC117: { locationName: "Kolhapur", connection: conKolhapur },
  C41JV: { locationName: "Secunderabad", connection: conSecunderabad },
  HHC119: { locationName: "Andheri", connection: conAndheri },
  HHC120: { locationName: "Sahakarnagar", connection: conSahakarnagar },
  HHC121: { locationName: "Gurgaon-14", connection: conGurgaon14 },
  HHC122: { locationName: "Gurgaon-49", connection: conGurgaon49 },
  HHC123: { locationName: "Kemps-Corner", connection: conkc },
  HHC124: { locationName: "Latur", connection: conLatur },
  HHC125: { locationName: "Indore", connection: conIndore },
  C42FD: { locationName: "Mysore", connection: conMysore },
  HHC127: { locationName: "Undri", connection: conUndri },
  HHC128: { locationName: "Vashi", connection: conVashi },
  HHC129: { locationName: "Hinjewadi", connection: conHinjewadi },
  C3KKO: { locationName: "Lucknow", connection: conLucknow },
  HHC131: { locationName: "Kalaburagi", connection: conKalaburagi },
  C2H33: { locationName: "Rajaji Nagar", connection: conRajajiNagar },
  C3HDG: { locationName: "Sarjapura", connection: conSarjapura },
  C419D: { locationName: "Katraj", connection: conKatraj },
  HHC135: { locationName: "Lead", connection: conLead },
  C419B: { locationName: "Ahmedabad", connection: conAhmedabad },
  C41H6: { locationName: "Mohali", connection: conMohali },
  C43N1: { locationName: "Aurangabad", connection: conAurangabad },
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

module.exports = {
  saveInvoice,
};
