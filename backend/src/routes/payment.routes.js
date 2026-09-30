const express = require("express");

const {
    createPayment,
    handlePaymentWebhook,
} = require("../controllers/payment.controller");

const router = express.Router();

router.post("/:bookingId/payment", createPayment);
router.post("/webhook", handlePaymentWebhook);

module.exports = router;