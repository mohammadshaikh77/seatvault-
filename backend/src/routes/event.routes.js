const express = require("express");
const {
    getAvailableSeats,
    holdSeat,
} = require("../controllers/event.controller");

const router = express.Router();

router.get("/:eventId/seats", getAvailableSeats);
router.post("/:eventId/seats/:eventSeatId/hold", holdSeat);

module.exports = router;