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
  HHC000: { locationName: "Test", connection: conTest },
  HHC101: { locationName: "Hyderabad", connection: conHyderabad },
  HHC102: { locationName: "DP Road", connection: conDP },
  HHC103: { locationName: "Surat", connection: conSurat },
  HHC104: { locationName: "Ludhiana", connection: conLudhiana },
  HHC105: { locationName: "Indiranagar", connection: conIndiranagar },
  HHC106: { locationName: "Dighi", connection: conDighi },
  HHC107: { locationName: "Thane", connection: conThane },
  HHC108: { locationName: "Belagavi", connection: conBelgavi },
  HHC109: { locationName: "HSR", connection: conHSR },
  HHC110: { locationName: "Bangalore", connection: conBangalore },
  HHC111: { locationName: "Navi-Mumbai", connection: conNM },
  HHC112: { locationName: "Pimpri-Chinchwad", connection: conPC },
  HHC113: { locationName: "Nashik", connection: conNashik },
  HHC114: { locationName: "Salunkhe-Vihar", connection: conSV },
  HHC115: { locationName: "Chakan", connection: conChakan },
  HHC116: { locationName: "Baner", connection: conBaner },
  HHC117: { locationName: "Kolhapur", connection: conKolhapur },
  HHC118: { locationName: "Secunderabad", connection: conSecunderabad },
  HHC119: { locationName: "Andheri", connection: conAndheri },
  HHC120: { locationName: "Sahakarnagar", connection: conSahakarnagar },
  HHC121: { locationName: "Gurgaon-14", connection: conGurgaon14 },
  HHC122: { locationName: "Gurgaon-49", connection: conGurgaon49 },
  HHC123: { locationName: "Kemps-Corner", connection: conkc },
  HHC124: { locationName: "Latur", connection: conLatur },
  HHC125: { locationName: "Indore", connection: conIndore },
  HHC126: { locationName: "Mysore", connection: conMysore },
  HHC127: { locationName: "Undri", connection: conUndri },
  HHC128: { locationName: "Vashi", connection: conVashi },
  HHC129: { locationName: "Hinjewadi", connection: conHinjewadi },
  HHC130: { locationName: "Lucknow", connection: conLucknow },
  HHC131: { locationName: "Kalaburagi", connection: conKalaburagi },
  HHC132: { locationName: "Rajaji Nagar", connection: conRajajiNagar },
  HHC133: { locationName: "Sarjapura", connection: conSarjapura },
  HHC134: { locationName: "Katraj", connection: conKatraj },
  HHC135: { locationName: "Lead", connection: conLead },
  HHC136: { locationName: "Ahmedabad", connection: conAhmedabad },
  HHC137: { locationName: "Mohali", connection: conMohali },
  HHC138: { locationName: "Aurangabad", connection: conAurangabad },
  HHC139: { locationName: "Whitefield", connection: conWhitefield },
};

const insuranceCompanies = [
  { id: 516571, name: "Aditya Birla Health Insurance Co. Limited" },
  { id: 516572, name: "Medi Assist Insurance TPA India Pvt Ltd" },
  { id: 522771, name: "MD India Healthcare (TPA) Services (Pvt.) Ltd." },
  { id: 523192, name: "Heritage Health Insurance TPA Private Limited" },
  { id: 523194, name: "Genins India Insurance TPA Limited" },
  { id: 523195, name: "Health India Insurance TPA Services Private Limited" },
  { id: 523196, name: "Safeway Insurance TPA Private Limited" },
  { id: 523197, name: "Health Insurance TPA of India Limited" },
  { id: 523207, name: "MedSave Health Insurance TPA Limited" },
  { id: 523375, name: "GOOD HEALTH INSURANCE TPA LIMITED" },
  { id: 523376, name: "Universal Sompo General Insurance Co Ltd" },
  { id: 523377, name: "PARK MEDICLAIM TPA PVT LTD" },
  { id: 523378, name: "Ericson Insurance TPA Pvt. Ltd" },
  { id: 523677, name: "Raksha Health Insurance TPA Pvt Ltd" },
  { id: 523678, name: "Vidal Health Insurance TPA Private Limited" },
  {
    id: 523679,
    name: "Paramount Health Services & Insurance TPA Private Limited",
  },
  { id: 523680, name: "ICICI Lombard General Insurance Co Ltd" },
  { id: 523681, name: "Family Health Plan Insurance TPA Limited" },
  { id: 523843, name: "Bajaj Allianz General Insurance" },
  { id: 523844, name: "HDFC ERGO General Insurance" },
  { id: 523845, name: "Niva Bupa Health Insurance" },
  { id: 523846, name: "Volo Health Insurance TPA Pvt Limited(East West)" },
  { id: 523847, name: "Future Generali India Insurance Company (Corporate)" },
  { id: 523848, name: "IFFCO-TOKIO General Insurance Co. Limited" },
  { id: 523849, name: "Liberty General Insurance Limited" },
  { id: 523850, name: "Reliance General Insurance Co. Ltd" },
  { id: 523893, name: "Cholamandalam MS General Insurance" },
  { id: 523894, name: "Star Health and Allied Insurance Co Ltd" },
  { id: 524231, name: "Care Health Insurance" },
  { id: 524232, name: "United Healthcare Parekh TPA Private Limited" },
  { id: 524800, name: "Medvantage Insurance TPA Private Limited" },
  { id: 526981, name: "Tata AIG General Insurance" },
  { id: 526989, name: "SBI General Insurance" },
];

const payerInsurerMap = {
  "Medi Assist Insurance TPA India Pvt Ltd": {
    PayerId: "516572",
    Insurers: [
      { InsurerId: "1", InsurerName: "The New India Assurance Co. Ltd" },
      { InsurerId: "2", InsurerName: "Reliance General Insurance Co. Ltd" },
      { InsurerId: "4", InsurerName: "The Oriental Insurance Co. Ltd." },
      { InsurerId: "5", InsurerName: "United India Insurance Co. Ltd" },
      { InsurerId: "6", InsurerName: "National Insurance Co. Ltd." },
      {
        InsurerId: "7",
        InsurerName: "ICICI Lombard General Insurance Co. Ltd.",
      },
      {
        InsurerId: "8",
        InsurerName: "Cholamandalam MS General Insurance Company Limited",
      },
      {
        InsurerId: "9",
        InsurerName: "Royal Sundaram General Insurance Company Limited",
      },
      { InsurerId: "10", InsurerName: "IFFCO-TOKIO General Insurance Co. Ltd" },
      {
        InsurerId: "11",
        InsurerName: "HDFC Ergo General Insurance Company Limited",
      },
      { InsurerId: "13", InsurerName: "HDFC ERGO Health Insurance Ltd" },
      {
        InsurerId: "15",
        InsurerName: "Bharti AXA General Insurance Company Limited",
      },
      { InsurerId: "16", InsurerName: "RELIANCE NIPPON LIFE INSURANCE CO LTD" },
      { InsurerId: "17", InsurerName: "Care Health Insurance" },
      {
        InsurerId: "21",
        InsurerName: "IndiaFirst Life Insurance Company Limited",
      },
      { InsurerId: "22", InsurerName: "MaxBupa Health Insurance Co.Ltd" },
      {
        InsurerId: "23",
        InsurerName: "Bajaj Allianz General Insurance Co. Ltd.",
      },
      { InsurerId: "24", InsurerName: "SBI General Insurance Company Limited" },
      { InsurerId: "25", InsurerName: "Liberty General Insurance Limited" },
      { InsurerId: "26", InsurerName: "Others" },
      {
        InsurerId: "28",
        InsurerName: "Aditya Birla Health Insurance Co. Limited",
      },
      {
        InsurerId: "29",
        InsurerName: "ManipalCigna Health Insurance Company Limited",
      },
      { InsurerId: "30", InsurerName: "Tata AIA Life Insurance" },
      {
        InsurerId: "32",
        InsurerName: "Tata AIG General Insurance Company LTD",
      },
      { InsurerId: "33", InsurerName: "Shikhar Insurance Co Ltd" },
      { InsurerId: "34", InsurerName: "Go Digit General Insurance Limited" },
      {
        InsurerId: "35",
        InsurerName: "Raheja QBE General Insurance Company Limited",
      },
      {
        InsurerId: "36",
        InsurerName: "Magma HDI General Insurance Company LTD",
      },
      { InsurerId: "37", InsurerName: "Navi General Insurance Limited" },
      {
        InsurerId: "38",
        InsurerName: "Edelweiss General Insurance Company Limited",
      },
      {
        InsurerId: "39",
        InsurerName: "Future Generali India Insurance Company Ltd.",
      },
    ],
  },
  "MDIndia Health Insurance TPA Pvt. Ltd.": {
    PayerId: "522771",
    Insurers: [
      {
        InsurerId: "1",
        InsurerName: "Apollo Munich Insurance Company Limited",
      },
      {
        InsurerId: "2",
        InsurerName: "ICICI Lombard General Insurance Company",
      },
      {
        InsurerId: "3",
        InsurerName: "Future Generali India Insurance Company Limited",
      },
      { InsurerId: "4", InsurerName: "HDFC ERGO General Insurance Co." },
      { InsurerId: "5", InsurerName: "IFFCO-TOKIO GENERAL INSURANCE CO. LTD." },
      { InsurerId: "6", InsurerName: "Icici Lombard Insurance Company Ltd" },
      { InsurerId: "7", InsurerName: "National Insurance Company Limited" },
      { InsurerId: "8", InsurerName: "Reliance General Insurance" },
      {
        InsurerId: "9",
        InsurerName: "Royal Sundaram Alliance Insurance Company Limited",
      },
      {
        InsurerId: "10",
        InsurerName: "The New India Assurance Company Limited",
      },
      { InsurerId: "11", InsurerName: "The Oriental Insurance Company Ltd" },
      {
        InsurerId: "12",
        InsurerName: "United India Insurance Company Limited",
      },
      {
        InsurerId: "13",
        InsurerName: "Universal Sompo General Insurance Co. Ltd.",
      },
      { InsurerId: "14", InsurerName: "L&T General Insurance Company Ltd" },
      { InsurerId: "15", InsurerName: "Sbi General Insurance Company Ltd" },
      {
        InsurerId: "16",
        InsurerName: "Liberty Videocon General Insurance Company Ltd.",
      },
      { InsurerId: "17", InsurerName: "Care Health Insurance Limited" },
      {
        InsurerId: "18",
        InsurerName: "Niva Bupa Health Insurance Company Limited",
      },
      { InsurerId: "19", InsurerName: "Bajaj Allianz" },
      {
        InsurerId: "20",
        InsurerName: "Tata Aig General Insurance Company Limited",
      },
      { InsurerId: "21", InsurerName: "Aditya Birla Health Insurance Company" },
      {
        InsurerId: "22",
        InsurerName: "Magma Hdi General Insurance Company Ltd.",
      },
      { InsurerId: "23", InsurerName: "Zuno General Insurance Limited" },
      { InsurerId: "24", InsurerName: "Birla Sun Life" },
      {
        InsurerId: "25",
        InsurerName: "ManipalCigna Health Insurance Company Limited",
      },
      {
        InsurerId: "26",
        InsurerName: "Cholamandalam Ms General Insurance Company Limited",
      },
      { InsurerId: "27", InsurerName: "Max Life Insurance Company Limited" },
      { InsurerId: "28", InsurerName: "The New India Assurance Co. Ltd" },
      { InsurerId: "29", InsurerName: "United India Insurance Co. Ltd" },
      { InsurerId: "30", InsurerName: "National Insurance Co. Ltd." },
      { InsurerId: "31", InsurerName: "The Oriental Insurance Co. Ltd." },
      { InsurerId: "32", InsurerName: "National Insurance Company Ltd." },
      { InsurerId: "33", InsurerName: "The New India Assurance Company Ltd." },
      { InsurerId: "34", InsurerName: "The Oriental Insurance Company Ltd." },
      { InsurerId: "35", InsurerName: "United India Insurance Company Ltd." },
    ],
  },
  "Heritage Health Insurance TPA Private Limited": {
    PayerId: "523192",
    Insurers: [
      { InsurerId: "1", InsurerName: "National Insurance Company Ltd." },
      { InsurerId: "2", InsurerName: "The New India Assurance Company Ltd." },
      { InsurerId: "3", InsurerName: "The Oriental Insurance Company Ltd." },
      { InsurerId: "4", InsurerName: "United India Insurance Company Ltd." },
    ],
  },
  "Genins India Insurance TPA Limited": {
    PayerId: "523194",
    Insurers: [
      {
        InsurerId: "1",
        InsurerName: "National Insurance Company Ltd.",
      },
      {
        InsurerId: "2",
        InsurerName: "The New India Assurance Company Ltd.",
      },
      {
        InsurerId: "3",
        InsurerName: "The Oriental Insurance Company Ltd.",
      },
      {
        InsurerId: "4",
        InsurerName: "United India Insurance Company Ltd.",
      },
    ],
  },
  "Health India Insurance TPA Services Private Limited": {
    PayerId: "523195",
    Insurers: [
      {
        InsurerId: "1",
        InsurerName: "National Insurance Company Ltd.",
      },
      {
        InsurerId: "2",
        InsurerName: "The New India Assurance Company Ltd.",
      },
      {
        InsurerId: "3",
        InsurerName: "The Oriental Insurance Company Ltd.",
      },
      {
        InsurerId: "4",
        InsurerName: "United India Insurance Company Ltd.",
      },
    ],
  },
  "Safeway Insurance TPA Private Limited": {
    PayerId: "523196",
    Insurers: [
      {
        InsurerId: "1",
        InsurerName: "National Insurance Company Ltd.",
      },
      {
        InsurerId: "2",
        InsurerName: "The New India Assurance Company Ltd.",
      },
      {
        InsurerId: "3",
        InsurerName: "The Oriental Insurance Company Ltd.",
      },
      {
        InsurerId: "4",
        InsurerName: "United India Insurance Company Ltd.",
      },
    ],
  },
  "Health Insurance TPA of India Limited": {
    PayerId: "523197",
    Insurers: [
      {
        InsurerId: "1",
        InsurerName: "National Insurance Company Ltd.",
      },
      {
        InsurerId: "2",
        InsurerName: "The New India Assurance Company Ltd.",
      },
      {
        InsurerId: "3",
        InsurerName: "The Oriental Insurance Company Ltd.",
      },
      {
        InsurerId: "4",
        InsurerName: "United India Insurance Company Ltd.",
      },
    ],
  },
  "Medsave Health Insurance TPA Limited": {
    PayerId: "523207",
    Insurers: [
      { InsurerId: "1", InsurerName: "The New India Assurance Co. Ltd" },
      { InsurerId: "2", InsurerName: "Reliance General Insurance Co. Ltd." },
      { InsurerId: "3", InsurerName: "The Oriental Insurance Co. Ltd." },
      { InsurerId: "4", InsurerName: "United India Insurance Co. Ltd" },
      { InsurerId: "5", InsurerName: "National Insurance Co. Ltd." },
      {
        InsurerId: "6",
        InsurerName: "ICICI Lombard General Insurance Co. Ltd.",
      },
      {
        InsurerId: "7",
        InsurerName: "Cholamandalam MS General Insurance Company Limited",
      },
      {
        InsurerId: "8",
        InsurerName: "Royal Sundaram General Insurance Company Limited",
      },
      { InsurerId: "9", InsurerName: "IFFCO-TOKIO General Insurance Co. Ltd" },
      {
        InsurerId: "10",
        InsurerName: "HDFC Ergo General Insurance Company Limited",
      },
      { InsurerId: "11", InsurerName: "HDFC ERGO Health Insurance Ltd" },
      {
        InsurerId: "12",
        InsurerName: "Bharti AXA General Insurance Company Limited",
      },
      { InsurerId: "13", InsurerName: "RELIANCE NIPPON LIFE INSURANCE CO LTD" },
      { InsurerId: "14", InsurerName: "Care Health Insurance" },
      {
        InsurerId: "15",
        InsurerName: "IndiaFirst Life Insurance Company Limited",
      },
      { InsurerId: "16", InsurerName: "MaxBupa Health Insurance Co.Ltd" },
      {
        InsurerId: "17",
        InsurerName: "Bajaj Allianz General Insurance Co. Ltd.",
      },
      { InsurerId: "18", InsurerName: "SBI General Insurance Company Limited" },
      { InsurerId: "19", InsurerName: "Liberty General Insurance Limited" },
      { InsurerId: "20", InsurerName: "Others" },
      {
        InsurerId: "21",
        InsurerName: "Aditya Birla Health Insurance Co. Limited",
      },
      {
        InsurerId: "22",
        InsurerName: "ManipalCigna Health Insurance Company Limited",
      },
      { InsurerId: "23", InsurerName: "Tata AIA Life Insurance" },
      {
        InsurerId: "24",
        InsurerName: "Tata AIG General Insurance Company LTD",
      },
      { InsurerId: "25", InsurerName: "Shikhar Insurance Co Ltd" },
      { InsurerId: "26", InsurerName: "Go Digit General Insurance Limited" },
      {
        InsurerId: "27",
        InsurerName: "Raheja QBE General Insurance Company Limited",
      },
      {
        InsurerId: "28",
        InsurerName: "Magma HDI General Insurance Company LTD",
      },
      { InsurerId: "29", InsurerName: "Navi General Insurance Limited" },
      {
        InsurerId: "30",
        InsurerName: "Edelweiss General Insurance Company Limited",
      },
    ],
  },
  "GOOD HEALTH INSURANCE TPA LIMITED": {
    PayerId: "523375",
    Insurers: [
      {
        InsurerId: "1",
        InsurerName: "National Insurance Company Ltd.",
      },
      {
        InsurerId: "2",
        InsurerName: "The New India Assurance Company Ltd.",
      },
      {
        InsurerId: "3",
        InsurerName: "The Oriental Insurance Company Ltd.",
      },
      {
        InsurerId: "4",
        InsurerName: "United India Insurance Company Ltd.",
      },
    ],
  },
  "PARK MEDICLAIM TPA PVT LTD": {
    PayerId: "523377",
    Insurers: [
      {
        InsurerId: "1",
        InsurerName: "National Insurance Company Ltd.",
      },
      {
        InsurerId: "2",
        InsurerName: "The New India Assurance Company Ltd.",
      },
      {
        InsurerId: "3",
        InsurerName: "The Oriental Insurance Company Ltd.",
      },
      {
        InsurerId: "4",
        InsurerName: "United India Insurance Company Ltd.",
      },
    ],
  },
  "Ericson Insurance TPA Pvt. Ltd": {
    PayerId: "523378",
    Insurers: [
      {
        InsurerId: "1",
        InsurerName: "National Insurance Company Ltd.",
      },
      {
        InsurerId: "2",
        InsurerName: "The New India Assurance Company Ltd.",
      },
      {
        InsurerId: "3",
        InsurerName: "The Oriental Insurance Company Ltd.",
      },
      {
        InsurerId: "4",
        InsurerName: "United India Insurance Company Ltd.",
      },
    ],
  },
  "Raksha Health Insurance TPA Private Limited": {
    PayerId: "523677",
    Insurers: [
      { InsurerId: "1", InsurerName: "The New India Assurance Co. Ltd" },
      { InsurerId: "10", InsurerName: "IFFCO-TOKIO General Insurance Co. Ltd" },
      {
        InsurerId: "11",
        InsurerName: "HDFC Ergo General Insurance Company Limited",
      },
      { InsurerId: "13", InsurerName: "HDFC ERGO Health Insurance Ltd" },
      {
        InsurerId: "15",
        InsurerName: "Bharti AXA General Insurance Company Limited",
      },
      { InsurerId: "16", InsurerName: "RELIANCE NIPPON LIFE INSURANCE CO LTD" },
      { InsurerId: "17", InsurerName: "Care Health Insurance" },
      { InsurerId: "2", InsurerName: "Reliance General Insurance Co. Ltd." },
      {
        InsurerId: "21",
        InsurerName: "IndiaFirst Life Insurance Company Limited",
      },
      { InsurerId: "22", InsurerName: "MaxBupa Health Insurance Co.Ltd" },
      {
        InsurerId: "23",
        InsurerName: "Bajaj Allianz General Insurance Co. Ltd.",
      },
      { InsurerId: "24", InsurerName: "SBI General Insurance Company Limited" },
      { InsurerId: "25", InsurerName: "Liberty General Insurance Limited" },
      { InsurerId: "26", InsurerName: "Others" },
      {
        InsurerId: "28",
        InsurerName: "Aditya Birla Health Insurance Co. Limited",
      },
      {
        InsurerId: "29",
        InsurerName: "ManipalCigna Health Insurance Company Limited",
      },
      { InsurerId: "30", InsurerName: "Tata AIA Life Insurance" },
      {
        InsurerId: "32",
        InsurerName: "Tata AIG General Insurance Company LTD",
      },
      { InsurerId: "33", InsurerName: "Shikhar Insurance Co Ltd" },
      { InsurerId: "34", InsurerName: "Go Digit General Insurance Limited" },
      {
        InsurerId: "35",
        InsurerName: "Raheja QBE General Insurance Company Limited",
      },
      {
        InsurerId: "36",
        InsurerName: "Magma HDI General Insurance Company LTD",
      },
      { InsurerId: "37", InsurerName: "Navi General Insurance Limited" },
      {
        InsurerId: "38",
        InsurerName: "Edelweiss General Insurance Company Limited",
      },
      { InsurerId: "4", InsurerName: "The Oriental Insurance Co. Ltd." },
      { InsurerId: "5", InsurerName: "United India Insurance Co. Ltd" },
      { InsurerId: "6", InsurerName: "National Insurance Co. Ltd." },
      {
        InsurerId: "7",
        InsurerName: "ICICI Lombard General Insurance Co. Ltd.",
      },
      {
        InsurerId: "8",
        InsurerName: "Cholamandalam MS General Insurance Company Limited",
      },
      {
        InsurerId: "9",
        InsurerName: "Royal Sundaram General Insurance Company Limited",
      },
    ],
  },
  "Vidal Health Insurance TPA Private Limited": {
    PayerId: "523678",
    Insurers: [
      { InsurerId: "1", InsurerName: "Acko General Insurance Limited" },
      { InsurerId: "10", InsurerName: "HDFC Ergo General Insurance Co Ltd" },
      { InsurerId: "11", InsurerName: "HDFC ERGO Health Insurance Ltd" },
      {
        InsurerId: "12",
        InsurerName: "ICICI Lombard General Insurance Company Ltd",
      },
      { InsurerId: "13", InsurerName: "Iffco Tokio General Insurance Co. Ltd" },
      {
        InsurerId: "14",
        InsurerName: "Kotak Mahindra General Insurance Company Ltd",
      },
      { InsurerId: "15", InsurerName: "L & T General Insurance Co. Ltd." },
      { InsurerId: "16", InsurerName: "Liberty General Insurance Co.Ltd" },
      {
        InsurerId: "17",
        InsurerName: "Magma HDI General Insurance Company Ltd",
      },
      { InsurerId: "18", InsurerName: "ManipalCigna Health Insurance Company" },
      { InsurerId: "19", InsurerName: "National Insurance Co. Ltd" },
      {
        InsurerId: "2",
        InsurerName: "Aditya Birla Health Insurance Company Ltd",
      },
      { InsurerId: "20", InsurerName: "NAVI General Insurance Company" },
      { InsurerId: "21", InsurerName: "New India Assurance Co. Ltd" },
      {
        InsurerId: "22",
        InsurerName: "Niva Bupa Health Insurance Company Limited",
      },
      { InsurerId: "23", InsurerName: "Oriental Insurance Co. Ltd" },
      { InsurerId: "24", InsurerName: "Reliance General Insurance Co. Ltd" },
      {
        InsurerId: "25",
        InsurerName: "Royal Sundaram Alliance Insurance Co. Ltd.",
      },
      { InsurerId: "26", InsurerName: "SBI General Insurance Co. Ltd" },
      { InsurerId: "27", InsurerName: "Self Funded Scheme" },
      { InsurerId: "28", InsurerName: "Tata AIG General Insurance Co. Ltd." },
      { InsurerId: "29", InsurerName: "United India Insurance Co Ltd" },
      {
        InsurerId: "3",
        InsurerName: "Aditya Birla Sun Life Insurance Company Ltd",
      },
      {
        InsurerId: "30",
        InsurerName: "Universal Sompo General Insurance Co.Ltd",
      },
      {
        InsurerId: "4",
        InsurerName: "Bajaj Allianz General Insurance Co. Ltd",
      },
      { InsurerId: "5", InsurerName: "Bharti AXA Insurance Co." },
      { InsurerId: "6", InsurerName: "Care Health Insurance Ltd" },
      {
        InsurerId: "7",
        InsurerName: "Cholamandalam MS General Insurance Company Limited",
      },
      {
        InsurerId: "8",
        InsurerName: "Edelweiss General Insurance Company Ltd",
      },
      {
        InsurerId: "9",
        InsurerName: "Go Digit General Insurance Company Limited",
      },
    ],
  },
  "Paramount Health Services & Insurance TPA Private Limited": {
    PayerId: "523679",
    Insurers: [
      {
        InsurerId: "1",
        InsurerName: "Magma HDI General Insurance Company Limited",
      },
      { InsurerId: "10", InsurerName: "BAJAJ ALLIANZ" },
      { InsurerId: "11", InsurerName: "Bharti AXA" },
      { InsurerId: "12", InsurerName: "Care Health Insurance Company Limited" },
      {
        InsurerId: "13",
        InsurerName: "Cholamandalam General Insurance Co Ltd",
      },
      {
        InsurerId: "14",
        InsurerName: "Future Generali India Insurance Company Ltd.",
      },
      { InsurerId: "16", InsurerName: "Go Digit General Insurance Ltd." },
      { InsurerId: "17", InsurerName: "HDFC ERGO Health Insurance Ltd." },
      {
        InsurerId: "18",
        InsurerName: "HDFC Ergo General Insurance Company Limited",
      },
      { InsurerId: "19", InsurerName: "HDFC Life Insurance company Limited" },
      { InsurerId: "2", InsurerName: "Aegon Life Insurance Company Ltd." },
      { InsurerId: "20", InsurerName: "ICICI Lombard" },
      {
        InsurerId: "21",
        InsurerName: "IFFCO Tokio General Insurance Company Ltd.",
      },
      {
        InsurerId: "22",
        InsurerName: "Zurich  Kotak General Insurance Co. Ltd.",
      },
      {
        InsurerId: "23",
        InsurerName: "Zurich Kotak General Insurance Company(India) Limited",
      },
      { InsurerId: "24", InsurerName: "L&T GENERAL INSURANCE COMPANY LIMITED" },
      { InsurerId: "25", InsurerName: "Reliance General Insurance Co. Ltd" },
      {
        InsurerId: "26",
        InsurerName: "Royal Sundaram General Insurance Co Ltd",
      },
      { InsurerId: "27", InsurerName: "SBI General Insurance Company Ltd." },
      {
        InsurerId: "28",
        InsurerName: "STAR HEALTH AND ALLIED INSURANCE COMPANY LTD.",
      },
      { InsurerId: "29", InsurerName: "Shriram General Insurance Co" },
      {
        InsurerId: "3",
        InsurerName: "ManipalCigna Health Insurance Company Limited",
      },
      {
        InsurerId: "30",
        InsurerName: "Tata AIG General Insurance Company Ltd.",
      },
      { InsurerId: "31", InsurerName: "The New India Assurance Company Ltd." },
      { InsurerId: "32", InsurerName: "The Oriental Insurance Company Ltd." },
      { InsurerId: "33", InsurerName: "United India Insurance Company Ltd." },
      {
        InsurerId: "34",
        InsurerName: "Universal Sompo General Insurance Company Ltd.",
      },
      { InsurerId: "35", InsurerName: "Zuno General Insurance Limited" },
      {
        InsurerId: "36",
        InsurerName: "Aditya Birla Health Insurance Company Limited",
      },
      {
        InsurerId: "37",
        InsurerName: "LIBERTY GENERAL INSURANCE COMPANY LIMITED",
      },
      { InsurerId: "4", InsurerName: "Max Bupa" },
      {
        InsurerId: "5",
        InsurerName: "Raheja QBE General Insurance Company Limited",
      },
      { InsurerId: "6", InsurerName: "Max Life Insurance Company" },
      { InsurerId: "7", InsurerName: "National Insurance Company Ltd." },
      { InsurerId: "8", InsurerName: "Navi General Insurance Ltd" },
      { InsurerId: "9", InsurerName: "Niva Bupa Health Insurance Co. Ltd." },
    ],
  },
  "Family Health Plan Insurance TPA Limited": {
    PayerId: "523681",
    Insurers: [
      { InsurerId: "1", InsurerName: "Acko General Insurance Limited" },
      {
        InsurerId: "2",
        InsurerName: "Aditya Birla Health Insurance Company Ltd",
      },
      {
        InsurerId: "3",
        InsurerName: "Aditya Birla Sun Life Insurance Company Ltd",
      },
      {
        InsurerId: "4",
        InsurerName: "Bajaj Allianz General Insurance Co. Ltd",
      },
      { InsurerId: "5", InsurerName: "Bharti AXA Insurance Co." },
      { InsurerId: "6", InsurerName: "Care Health Insurance Ltd" },
      {
        InsurerId: "7",
        InsurerName: "Cholamandalam MS General Insurance Company Limited",
      },
      {
        InsurerId: "9",
        InsurerName: "Go Digit General Insurance Company Limited",
      },
      { InsurerId: "10", InsurerName: "HDFC Ergo General Insurance Co Ltd" },
      { InsurerId: "11", InsurerName: "HDFC ERGO Health Insurance Ltd" },
      {
        InsurerId: "12",
        InsurerName: "ICICI Lombard General Insurance Company Ltd",
      },
      { InsurerId: "13", InsurerName: "Iffco Tokio General Insurance Co. Ltd" },
      { InsurerId: "14", InsurerName: "Zurich Kotak General Insurance" },
      { InsurerId: "15", InsurerName: "L & T General Insurance Co. Ltd." },
      { InsurerId: "16", InsurerName: "Liberty General Insurance Co. Ltd" },
      { InsurerId: "17", InsurerName: "Magma General Insurance Limited" },
      { InsurerId: "18", InsurerName: "ManipalCigna Health Insurance Company" },
      { InsurerId: "19", InsurerName: "National Insurance Co. Ltd" },
      { InsurerId: "20", InsurerName: "NAVI General Insurance Company" },
      { InsurerId: "21", InsurerName: "New India Assurance Co. Ltd" },
      {
        InsurerId: "22",
        InsurerName: "Niva Bupa Health Insurance Company Limited",
      },
      { InsurerId: "23", InsurerName: "Oriental Insurance Co. Ltd" },
      { InsurerId: "24", InsurerName: "Reliance General Insurance Co. Ltd" },
      {
        InsurerId: "25",
        InsurerName: "Royal Sundaram Alliance Insurance Co. Ltd.",
      },
      { InsurerId: "26", InsurerName: "SBI General Insurance Co. Ltd" },
      { InsurerId: "27", InsurerName: "Self Funded Scheme" },
      { InsurerId: "28", InsurerName: "Tata AIG General Insurance Co. Ltd." },
      { InsurerId: "29", InsurerName: "United India Insurance Co Ltd" },
      {
        InsurerId: "30",
        InsurerName: "Universal Sompo General Insurance Co. Ltd",
      },
      { InsurerId: "31", InsurerName: "Star Health & Allied Insurance" },
      { InsurerId: "32", InsurerName: "Zuno General Insurance Company Ltd" },
      {
        InsurerId: "33",
        InsurerName: "Future Generali India Insurance Co. Ltd.",
      },
    ],
  },
  "Volo Health Insurance TPA Pvt Limited (East West)": {
    PayerId: "523846",
    Insurers: [
      { InsurerId: "1", InsurerName: "National Insurance Company Ltd." },
      { InsurerId: "2", InsurerName: "The New India Assurance Company Ltd." },
      { InsurerId: "3", InsurerName: "The Oriental Insurance Company Ltd." },
      { InsurerId: "4", InsurerName: "United India Insurance Company Ltd." },
    ],
  },
  "Medvantage Insurance TPA Private Limited": {
    PayerId: "524800",
    Insurers: [
      { InsurerId: "1", InsurerName: "The New India Assurance Co. Ltd" },
      { InsurerId: "10", InsurerName: "IFFCO-TOKIO General Insurance Co. Ltd" },
      {
        InsurerId: "11",
        InsurerName: "HDFC Ergo General Insurance Company Limited",
      },
      { InsurerId: "13", InsurerName: "HDFC ERGO Health Insurance Ltd" },
      {
        InsurerId: "15",
        InsurerName: "Bharti AXA General Insurance Company Limited",
      },
      { InsurerId: "16", InsurerName: "RELIANCE NIPPON LIFE INSURANCE CO LTD" },
      { InsurerId: "17", InsurerName: "Care Health Insurance" },
      { InsurerId: "2", InsurerName: "Reliance General Insurance Co. Ltd." },
      {
        InsurerId: "21",
        InsurerName: "IndiaFirst Life Insurance Company Limited",
      },
      { InsurerId: "22", InsurerName: "MaxBupa Health Insurance Co.Ltd" },
      {
        InsurerId: "23",
        InsurerName: "Bajaj Allianz General Insurance Co. Ltd.",
      },
      { InsurerId: "24", InsurerName: "SBI General Insurance Company Limited" },
      { InsurerId: "25", InsurerName: "Liberty General Insurance Limited" },
      { InsurerId: "26", InsurerName: "Others" },
      {
        InsurerId: "28",
        InsurerName: "Aditya Birla Health Insurance Co. Limited",
      },
      {
        InsurerId: "29",
        InsurerName: "ManipalCigna Health Insurance Company Limited",
      },
      { InsurerId: "30", InsurerName: "Tata AIA Life Insurance" },
      {
        InsurerId: "32",
        InsurerName: "Tata AIG General Insurance Company LTD",
      },
      { InsurerId: "33", InsurerName: "Shikhar Insurance Co Ltd" },
      { InsurerId: "34", InsurerName: "Go Digit General Insurance Limited" },
      {
        InsurerId: "35",
        InsurerName: "Raheja QBE General Insurance Company Limited",
      },
      {
        InsurerId: "36",
        InsurerName: "Magma HDI General Insurance Company LTD",
      },
      { InsurerId: "37", InsurerName: "Navi General Insurance Limited" },
      {
        InsurerId: "38",
        InsurerName: "Edelweiss General Insurance Company Limited",
      },
      { InsurerId: "4", InsurerName: "The Oriental Insurance Co. Ltd." },
      { InsurerId: "5", InsurerName: "United India Insurance Co. Ltd" },
      { InsurerId: "6", InsurerName: "National Insurance Co. Ltd." },
      {
        InsurerId: "7",
        InsurerName: "ICICI Lombard General Insurance Co. Ltd.",
      },
      {
        InsurerId: "8",
        InsurerName: "Cholamandalam MS General Insurance Company Limited",
      },
      {
        InsurerId: "9",
        InsurerName: "Royal Sundaram General Insurance Company Limited",
      },
    ],
  },
  "ICICI Prudential": {
    PayerId: "529911",
    Insurers: [
      { InsurerId: "1", InsurerName: "National Insurance Company Ltd." },
      { InsurerId: "2", InsurerName: "The New India Assurance Company Ltd." },
      { InsurerId: "3", InsurerName: "The Oriental Insurance Company Ltd." },
      { InsurerId: "4", InsurerName: "United India Insurance Company Ltd." },
    ],
  },
};

const getConnectionByProviderId = (providerId) => {
  const entry = providerMap[providerId];

  if (entry) {
    return { connection: entry.connection, location: entry.locationName };
  } else {
    return { connection: null, location: null };
  }
};

async function searchPatient(providerID, uhid, mobile) {
  console.log("searchPatient called with:", { providerID, uhid, mobile });
  const { connection } = getConnectionByProviderId("HHC000");
  if (!connection) {
    throw new Error("Invalid ProviderID");
  }

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      console.log("Searching Patient for ProviderID:", providerID);

      let query = `
        SELECT 
          p.phone,
          p.name,
          p.age,
          p.birth_date,
          p.sex,
          p.uid_no AS uhid,
          ic.companyname AS InsurerName,
          tpa.companyname AS PayerName,
          inv.creation_date AS DateOfAdmission,
          inv.due_date AS DateOfDischarge,
          inv.admission_no AS ipNumber
        FROM patient p
        LEFT JOIN invoice inv ON p.patient_id = inv.patient_id
        LEFT JOIN insurance_company ic ON inv.insurancecompany = ic.comapny_id
        LEFT JOIN insurance_company tpa ON inv.tpa = tpa.comapny_id
        WHERE p.ConfirmPatient = 1`;

      const params = [];

      if (uhid) {
        query += " AND p.Uid_no = ?";
        params.push(uhid);
      }

      if (mobile) {
        query += " AND p.phone = ?";
        params.push(mobile);
      }

      // Return only the latest invoice
      query += " ORDER BY inv.creation_date DESC LIMIT 1";

      tempCon.query(query, params, (error, rows) => {
        tempCon.release();
        if (error) return reject(error);

        if (rows.length === 0) return resolve([]);

        const enhancedRows = rows.map((row) => {
          let insurerId = null;
          let payerId = null;

          // Case 1: PayerName is null or 0 → use existing logic
          if (!row.PayerName || row.PayerName === "0") {
            const matchedInsurance = insuranceCompanies.find(
              (ins) =>
                ins.name.toLowerCase().trim() ===
                (row.InsurerName || "").toLowerCase().trim(),
            );

            const matchedTPA = insuranceCompanies.find(
              (ins) =>
                ins.name.toLowerCase().trim() ===
                (row.PayerName || "").toLowerCase().trim(),
            );

            insurerId = matchedInsurance ? matchedInsurance.id : null;
            payerId = matchedTPA ? matchedTPA.id : null;
          }

          // Case 2: PayerName exists → use payerInsurerMap
          else if (payerInsurerMap[row.PayerName]) {
            const payerData = payerInsurerMap[row.PayerName];
            payerId = payerData.PayerId;

            // Helper function to normalize insurer names
            const normalize = (str) =>
              (str || "")
                .toLowerCase()
                .replace(/[\.,]/g, "") // remove dots & commas
                .replace(/\s+/g, " ") // collapse multiple spaces
                .replace(/\bcompany\b/g, "co") // standardize "company" → "co"
                .replace(/\blimited\b/g, "ltd") // standardize "limited" → "ltd"
                .trim();

            const insurerNameNormalized = normalize(row.InsurerName);

            const matchedInsurer = payerData.Insurers.find((ins) => {
              const mapNameNormalized = normalize(ins.InsurerName);
              return insurerNameNormalized === mapNameNormalized;
            });

            console.log("Matching insurer:", {
              payer: row.PayerName,
              dbInsurerName: row.InsurerName,
              normalizedDB: insurerNameNormalized,
              matchedInsurer:
                matchedInsurer?.InsurerName ||
                "❌ No match (check punctuation/spacing)",
            });

            insurerId = matchedInsurer ? matchedInsurer.InsurerId : null;
          }

          return {
            ...row,
            insurerId,
            payerId,
          };
        });

        resolve(enhancedRows);
      });
    });
  });
}

async function savePatientStatusUpdate(payload) {
  const { hospitalID } = payload;
  const { connection } = getConnectionByProviderId("HHC000"); //getConnectionByProviderId(hospitalID);

  if (!connection) {
    throw new Error("Invalid HospitalID / Provider");
  }

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      const {
        uhid,
        ipNumber,
        mobileNumber,
        statusId,
        claimNumber,
        statusName,
        claimedAmount,
        approvedAmount,
        settledAmount,
        utrNo,
        remarks,
      } = payload;

      // Build dynamic WHERE condition based on available identifiers
      const identifiers = [];
      const identifierValues = [];

      if (uhid) {
        identifiers.push("uhid = ?");
        identifierValues.push(uhid);
      }
      if (ipNumber) {
        identifiers.push("ip_number = ?");
        identifierValues.push(ipNumber);
      }
      if (mobileNumber) {
        identifiers.push("mobile_number = ?");
        identifierValues.push(mobileNumber);
      }

      if (identifiers.length === 0) {
        return reject(new Error("At least one identifier must be provided"));
      }

      const whereClause = identifiers.join(" OR ");

      // Build the new status update object
      const statusUpdateObject = {
        timestamp: new Date().toISOString(),
        statusId: statusId,
        statusName: statusName,
        claimNumber: claimNumber,
        claimedAmount: claimedAmount,
        approvedAmount: approvedAmount,
        settledAmount: settledAmount,
        utrNo: utrNo,
        remarks: remarks,
      };

      // Start transaction
      tempCon.beginTransaction(async (err) => {
        if (err) return reject(err);

        try {
          // Step 1: Update patient_status_updates JSON column
          // const updateStatusSql = `
          //   UPDATE patient_status_updates
          //   SET status = JSON_ARRAY_APPEND(
          //     IFNULL(status, JSON_ARRAY()),
          //     '$',
          //     CAST(? AS JSON)
          //   )
          //   WHERE ${whereClause}
          // `;

          // await new Promise((res, rej) => {
          //   tempCon.query(
          //     updateStatusSql,
          //     [JSON.stringify(statusUpdateObject), ...identifierValues],
          //     (error) => (error ? rej(error) : res())
          //   );
          // });

          // Step 2: If ipNumber and settledAmount are provided, update insurance_invoice
          let patientId, invoiceId;

          if (ipNumber) {
            // Fetch invoice using admission_no
            const invoiceResult = await new Promise((res, rej) => {
              tempCon.query(
                `SELECT invoice_id, patient_id FROM invoice WHERE admission_no = ? LIMIT 1`,
                [ipNumber],
                (error, rows) => (error ? rej(error) : res(rows)),
              );
            });
            console.log(invoiceResult);
            if (invoiceResult && invoiceResult.length > 0) {
              invoiceId = invoiceResult[0].invoice_id;
              patientId = invoiceResult[0].patient_id;
            }
          } else {
            // Fetch patient_id using uhid or mobileNumber
            if (uhid) {
              const patientResult = await new Promise((res, rej) => {
                tempCon.query(
                  `SELECT patient_id FROM patient WHERE Uid_no = ? LIMIT 1`,
                  [uhid],
                  (error, rows) => (error ? rej(error) : res(rows)),
                );
              });
              console.log(patientResult);
              if (patientResult && patientResult.length > 0) {
                patientId = patientResult[0].patient_id;
              }
            } else if (mobileNumber) {
              const patientResult = await new Promise((res, rej) => {
                tempCon.query(
                  `SELECT patient_id FROM patient WHERE phone = ? LIMIT 1`,
                  [mobileNumber],
                  (error, rows) => (error ? rej(error) : res(rows)),
                );
              });
              console.log(patientResult);
              if (patientResult && patientResult.length > 0) {
                patientId = patientResult[0].patient_id;
              }
            }

            // Fetch invoice using patient_id
            if (patientId) {
              const invoiceResult = await new Promise((res, rej) => {
                tempCon.query(
                  `SELECT invoice_id FROM invoice WHERE patient_id = ? LIMIT 1`,
                  [patientId],
                  (error, rows) => (error ? rej(error) : res(rows)),
                );
              });
              console.log(invoiceResult);
              if (invoiceResult && invoiceResult.length > 0) {
                invoiceId = invoiceResult[0].invoice_id;
              }
            }
          }

          // Update insurance_invoice if possible
          // if (invoiceId && patientId && settledAmount != null) {
          //   await new Promise((res, rej) => {
          //     tempCon.query(
          //       `UPDATE insurance_invoice
          //        SET receivedamt = ?, paymentdate = NOW()
          //        WHERE invoiceid = ? AND patientid = ?`,
          //       [settledAmount, invoiceId, patientId],
          //       (error, rows) => (error ? rej(error) : res(rows))
          //     );
          //   });
          // }

          // ✅ CASE 1: Settled → existing logic
          if (statusName === "Settled" && invoiceId && settledAmount != null) {
            await new Promise((res, rej) => {
              tempCon.query(
                `UPDATE insurance_invoice
                  SET receivedamt = ?, paymentdate = NOW()
                  WHERE invoiceid = ? AND patientid = ? 
                  ORDER BY invoice_id DESC
                  LIMIT 1`,
                [settledAmount, invoiceId, patientId],
                (err, result) => (err ? rej(err) : res(result)),
              );
            });
          }

          // ✅ CASE 2: Pre-Auth Approved → NEW logic
          if (statusName === "Pre-Auth Approved" && approvedAmount != null) {
            await new Promise((res, rej) => {
              tempCon.query(
                `UPDATE invoice
                  SET receivedamt = ?
                  WHERE patient_id = ? AND invoice_id = ?
                  ORDER BY invoice_id DESC
                  LIMIT 1`,
                [approvedAmount, patientId, invoiceId],
                (err, result) => (err ? rej(err) : res(result)),
              );
            });
          }

          // ✅ NEW: Store every status update in IHXData JSON column
          if (invoiceId && patientId) {
            await new Promise((res, rej) => {
              const updateIHXSql = `
                  UPDATE invoice
                  SET IHXData = JSON_ARRAY_APPEND(
                    IFNULL(IHXData, JSON_ARRAY()),
                    '$',
                    CAST(? AS JSON)
                  )
                  WHERE invoice_id = ? AND patient_id = ?
                  LIMIT 1
                `;

              tempCon.query(
                updateIHXSql,
                [JSON.stringify(statusUpdateObject), invoiceId, patientId],
                (err, result) => (err ? rej(err) : res(result)),
              );
            });
          }

          // Commit transaction
          tempCon.commit((err) => {
            tempCon.release();
            if (err) return reject(err);
            resolve({
              success: true,
              message: "Patient status updated successfully",
            });
          });
        } catch (e) {
          // Rollback on error
          tempCon.rollback(() => {
            tempCon.release();
            reject(e);
          });
        }
      });
    });
  });
}

async function searchPatientProd(providerID, uhid, mobile) {
  console.log("searchPatient called with:", { providerID, uhid, mobile });
  const { connection } = getConnectionByProviderId(providerID);
  if (!connection) {
    throw new Error("Invalid ProviderID");
  }

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      console.log("Searching Patient for ProviderID:", providerID);

      let query = `
        SELECT 
          p.phone,
          p.name,
          p.age,
          p.birth_date,
          p.sex,
          p.uid_no AS uhid,
          ic.companyname AS InsurerName,
          tpa.companyname AS PayerName,
          inv.creation_date AS DateOfAdmission,
          inv.due_date AS DateOfDischarge,
          inv.admission_no AS ipNumber
        FROM patient p
        LEFT JOIN invoice inv ON p.patient_id = inv.patient_id
        LEFT JOIN insurance_company ic ON inv.insurancecompany = ic.comapny_id
        LEFT JOIN insurance_company tpa ON inv.tpa = tpa.comapny_id
        WHERE p.ConfirmPatient = 1`;

      const params = [];

      if (uhid) {
        query += " AND p.Uid_no = ?";
        params.push(uhid);
      }

      if (mobile) {
        query += " AND p.phone = ?";
        params.push(mobile);
      }

      // Return only the latest invoice
      query += " ORDER BY inv.creation_date DESC LIMIT 1";

      tempCon.query(query, params, (error, rows) => {
        tempCon.release();
        if (error) return reject(error);

        if (rows.length === 0) return resolve([]);

        const enhancedRows = rows.map((row) => {
          let insurerId = null;
          let payerId = null;

          // Case 1: PayerName is null or 0 → use existing logic
          if (!row.PayerName || row.PayerName === "0") {
            const matchedInsurance = insuranceCompanies.find(
              (ins) =>
                ins.name.toLowerCase().trim() ===
                (row.InsurerName || "").toLowerCase().trim(),
            );

            const matchedTPA = insuranceCompanies.find(
              (ins) =>
                ins.name.toLowerCase().trim() ===
                (row.PayerName || "").toLowerCase().trim(),
            );

            insurerId = matchedInsurance ? matchedInsurance.id : null;
            payerId = matchedTPA ? matchedTPA.id : null;
          }

          // Case 2: PayerName exists → use payerInsurerMap
          else if (payerInsurerMap[row.PayerName]) {
            const payerData = payerInsurerMap[row.PayerName];
            payerId = payerData.PayerId;

            // Helper function to normalize insurer names
            const normalize = (str) =>
              (str || "")
                .toLowerCase()
                .replace(/[\.,]/g, "") // remove dots & commas
                .replace(/\s+/g, " ") // collapse multiple spaces
                .replace(/\bcompany\b/g, "co") // standardize "company" → "co"
                .replace(/\blimited\b/g, "ltd") // standardize "limited" → "ltd"
                .trim();

            const insurerNameNormalized = normalize(row.InsurerName);

            const matchedInsurer = payerData.Insurers.find((ins) => {
              const mapNameNormalized = normalize(ins.InsurerName);
              return insurerNameNormalized === mapNameNormalized;
            });

            console.log("Matching insurer:", {
              payer: row.PayerName,
              dbInsurerName: row.InsurerName,
              normalizedDB: insurerNameNormalized,
              matchedInsurer:
                matchedInsurer?.InsurerName ||
                "❌ No match (check punctuation/spacing)",
            });

            insurerId = matchedInsurer ? matchedInsurer.InsurerId : null;
          }

          return {
            ...row,
            insurerId,
            payerId,
          };
        });

        resolve(enhancedRows);
      });
    });
  });
}

async function savePatientStatusUpdateProd(payload) {
  const { hospitalID } = payload;
  const { connection } = getConnectionByProviderId(hospitalID); //getConnectionByProviderId(hospitalID);

  if (!connection) {
    throw new Error("Invalid HospitalID / Provider");
  }

  return new Promise((resolve, reject) => {
    connection.getConnection((err, tempCon) => {
      if (err) return reject(err);

      const {
        uhid,
        ipNumber,
        mobileNumber,
        statusId,
        claimNumber,
        statusName,
        claimedAmount,
        approvedAmount,
        settledAmount,
        utrNo,
        remarks,
      } = payload;

      // Build dynamic WHERE condition based on available identifiers
      const identifiers = [];
      const identifierValues = [];

      if (uhid) {
        identifiers.push("uhid = ?");
        identifierValues.push(uhid);
      }
      if (ipNumber) {
        identifiers.push("ip_number = ?");
        identifierValues.push(ipNumber);
      }
      if (mobileNumber) {
        identifiers.push("mobile_number = ?");
        identifierValues.push(mobileNumber);
      }

      if (identifiers.length === 0) {
        return reject(new Error("At least one identifier must be provided"));
      }

      const whereClause = identifiers.join(" OR ");

      // Build the new status update object
      const statusUpdateObject = {
        timestamp: new Date().toISOString(),
        statusId: statusId,
        statusName: statusName,
        claimNumber: claimNumber,
        claimedAmount: claimedAmount,
        approvedAmount: approvedAmount,
        settledAmount: settledAmount,
        utrNo: utrNo,
        remarks: remarks,
      };

      // Start transaction
      tempCon.beginTransaction(async (err) => {
        if (err) return reject(err);

        try {
          // Step 1: Update patient_status_updates JSON column
          // const updateStatusSql = `
          //   UPDATE patient_status_updates
          //   SET status = JSON_ARRAY_APPEND(
          //     IFNULL(status, JSON_ARRAY()),
          //     '$',
          //     CAST(? AS JSON)
          //   )
          //   WHERE ${whereClause}
          // `;

          // await new Promise((res, rej) => {
          //   tempCon.query(
          //     updateStatusSql,
          //     [JSON.stringify(statusUpdateObject), ...identifierValues],
          //     (error) => (error ? rej(error) : res())
          //   );
          // });

          // Step 2: If ipNumber and settledAmount are provided, update insurance_invoice
          let patientId, invoiceId;

          if (ipNumber) {
            // Fetch invoice using admission_no
            const invoiceResult = await new Promise((res, rej) => {
              tempCon.query(
                `SELECT invoice_id, patient_id FROM invoice WHERE admission_no = ? LIMIT 1`,
                [ipNumber],
                (error, rows) => (error ? rej(error) : res(rows)),
              );
            });
            console.log(invoiceResult);
            if (invoiceResult && invoiceResult.length > 0) {
              invoiceId = invoiceResult[0].invoice_id;
              patientId = invoiceResult[0].patient_id;
            }
          } else {
            // Fetch patient_id using uhid or mobileNumber
            if (uhid) {
              const patientResult = await new Promise((res, rej) => {
                tempCon.query(
                  `SELECT patient_id FROM patient WHERE Uid_no = ? LIMIT 1`,
                  [uhid],
                  (error, rows) => (error ? rej(error) : res(rows)),
                );
              });
              console.log(patientResult);
              if (patientResult && patientResult.length > 0) {
                patientId = patientResult[0].patient_id;
              }
            } else if (mobileNumber) {
              const patientResult = await new Promise((res, rej) => {
                tempCon.query(
                  `SELECT patient_id FROM patient WHERE phone = ? LIMIT 1`,
                  [mobileNumber],
                  (error, rows) => (error ? rej(error) : res(rows)),
                );
              });
              console.log(patientResult);
              if (patientResult && patientResult.length > 0) {
                patientId = patientResult[0].patient_id;
              }
            }

            // Fetch invoice using patient_id
            if (patientId) {
              const invoiceResult = await new Promise((res, rej) => {
                tempCon.query(
                  `SELECT invoice_id FROM invoice WHERE patient_id = ? LIMIT 1`,
                  [patientId],
                  (error, rows) => (error ? rej(error) : res(rows)),
                );
              });
              console.log(invoiceResult);
              if (invoiceResult && invoiceResult.length > 0) {
                invoiceId = invoiceResult[0].invoice_id;
              }
            }
          }

          // Update insurance_invoice if possible
          // if (invoiceId && patientId && settledAmount != null) {
          //   await new Promise((res, rej) => {
          //     tempCon.query(
          //       `UPDATE insurance_invoice
          //        SET receivedamt = ?, paymentdate = NOW()
          //        WHERE invoiceid = ? AND patientid = ?
          //        ORDER BY invoice_id DESC
          //        LIMIT 1`,
          //       [settledAmount, invoiceId, patientId],
          //       (error, rows) => (error ? rej(error) : res(rows)),
          //     );
          //   });
          // }

          // ✅ CASE 1: Settled → existing logic
          if (statusName === "Settled" && invoiceId && settledAmount != null) {
            await new Promise((res, rej) => {
              tempCon.query(
                `UPDATE insurance_invoice
                  SET receivedamt = ?, paymentdate = NOW()
                  WHERE invoiceid = ? AND patientid = ? 
                  ORDER BY invoice_id DESC
                  LIMIT 1`,
                [settledAmount, invoiceId, patientId],
                (err, result) => (err ? rej(err) : res(result)),
              );
            });
          }

          // ✅ CASE 2: Pre-Auth Approved → NEW logic
          if (statusName === "Pre-Auth Approved" && approvedAmount != null) {
            await new Promise((res, rej) => {
              tempCon.query(
                `UPDATE invoice
                  SET receivedamt = ?
                  WHERE patient_id = ? AND invoice_id = ? 
                  ORDER BY invoice_id DESC
                   LIMIT 1`,
                [approvedAmount, patientId, invoiceId],
                (err, result) => (err ? rej(err) : res(result)),
              );
            });
          }

          // ✅ NEW: Store every status update in IHXData JSON column
          if (invoiceId && patientId) {
            await new Promise((res, rej) => {
              const updateIHXSql = `
                  UPDATE invoice
                  SET IHXData = JSON_ARRAY_APPEND(
                    IFNULL(IHXData, JSON_ARRAY()),
                    '$',
                    CAST(? AS JSON)
                  )
                  WHERE invoice_id = ? AND patient_id = ?
                  LIMIT 1
                `;

              tempCon.query(
                updateIHXSql,
                [JSON.stringify(statusUpdateObject), invoiceId, patientId],
                (err, result) => (err ? rej(err) : res(result)),
              );
            });
          }

          // Commit transaction
          tempCon.commit((err) => {
            tempCon.release();
            if (err) return reject(err);
            resolve({
              success: true,
              message: "Patient status updated successfully",
            });
          });
        } catch (e) {
          // Rollback on error
          tempCon.rollback(() => {
            tempCon.release();
            reject(e);
          });
        }
      });
    });
  });
}

module.exports = {
  searchPatient,
  savePatientStatusUpdate,
  searchPatientProd,
  savePatientStatusUpdateProd,
};

//Sample response
// [
//   {
//     HospitalID: 101,
//     MobileNumber: "9876543210",
//     PatientName: "John Doe",
//     PatientAge: 45,
//     PatientGender: "Male",
//     InsurerName: "ABC Insurance Co.",
//     PayerTPA: "XYZ TPA Ltd.",
//     DateOfAdmission: "2025-09-01",
//     DateOfDischarge: "2025-09-05",
//   },
// ];
