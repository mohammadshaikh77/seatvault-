const express = require("express");
const {
    getAvailableSeats,
    holdSeat,
    createBooking,
    confirmBooking,
} = require("../controllers/event.controller");

const router = express.Router();

router.get("/:eventId/seats", getAvailableSeats);
router.post("/:eventId/seats/:eventSeatId/hold", holdSeat);
router.post("/:eventId/bookings", createBooking);
router.post("/:eventId/bookings/:bookingId/confirm", confirmBooking);

module.exports = router;