const express = require("express");
const {
    getAvailableSeats,
    holdSeat,
    createBooking,
} = require("../controllers/event.controller");

const router = express.Router();

router.get("/:eventId/seats", getAvailableSeats);
router.post("/:eventId/seats/:eventSeatId/hold", holdSeat);
router.post("/:eventId/bookings", createBooking);

module.exports = router;