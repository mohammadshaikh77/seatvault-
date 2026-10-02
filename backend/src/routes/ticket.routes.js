const express = require("express");

const {
    createTicket,
} = require("../controllers/ticket.controller");

const router = express.Router();

router.post("/:bookingId/seats/:bookingSeatId/ticket", createTicket);

module.exports = router;