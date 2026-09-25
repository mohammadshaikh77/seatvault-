const express = require("express");
const { checkDatabase } = require("../controllers/health.controller");

const router = express.Router();

router.get("/db", checkDatabase);

module.exports = router;