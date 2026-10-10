// src/controllers/dashboardAuthController.js
//
// Dashboard sign-in — mounted at /ivr/dashboardAuth
//
//   POST /ivr/dashboardAuth/login   { mobile, pin } -> { token, user }
//        401 wrong mobile/PIN · 403 not an admin · 429 too many attempts
//   GET  /ivr/dashboardAuth/me      (Authorization: Bearer <token>) -> { user }
//
// Signing out is done in the browser by discarding the token.

var express = require("express");
var router = express.Router();
const { login, requireDashboardAdmin } = require("../util/dashboardAuth");

router.post("/login", async (req, res, next) => {
  try {
    const { mobile, pin } = req.body || {};
    const result = await login(mobile, pin, req.ip);
    res.status(200).json(result);
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).send(err.message);
    return next(err);
  }
});

router.get("/me", requireDashboardAdmin, (req, res) => {
  res.status(200).json({ user: req.dashboardUser });
});

module.exports = router;
