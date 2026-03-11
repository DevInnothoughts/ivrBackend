const express = require("express");
const { saveInvoice } = require("../models/pharmacyIntegrationModel");

const router = express.Router();

// router.post("/v1/saveInvoice", async (req, res) => {
//   try {
//     const { chemist_code, id } = req.body;

//     if (!chemist_code || !id) {
//       return res.status(400).json({
//         isSuccess: false,
//         errorMessage: "chemist_code and order_id are required",
//       });
//     }

//     await saveInvoice(chemist_code, req.body);

//     return res.status(200).json({
//       isSuccess: true,
//       errorMessage: null,
//     });
//   } catch (err) {
//     console.error("Save Invoice Error:", err);

//     return res.status(500).json({
//       isSuccess: false,
//       errorMessage: err.message || "Internal Error",
//     });
//   }
// });

router.post("/v1/saveInvoice", async (req, res) => {
  // 1️⃣ Always ACK immediately
  res.status(200).json({ status: "ok" });

  // 2️⃣ Process in background
  try {
    console.log("Pharmacy Webhook Payload:", JSON.stringify(req.body));

    const { chemist_code, id } = req.body;

    // Internal validation (NO response to webhook)
    if (!chemist_code || !id) {
      console.error("Webhook validation failed: missing chemist_code or id");
      return;
    }

    await saveInvoice(chemist_code, req.body);

    console.log("Invoice saved successfully for order:", id);
  } catch (err) {
    // Never throw to webhook caller
    console.error("Webhook processing error:", err);
  }
});

module.exports = router;
