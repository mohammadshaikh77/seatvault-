const express = require("express");
const {
    getAvailableSeats,
    holdSeat,
    createBooking,
    confirmBooking,
     cancelBooking,
} = require("../controllers/event.controller");

const router = express.Router();

router.get("/:eventId/seats", getAvailableSeats);
router.post("/:eventId/seats/:eventSeatId/hold", holdSeat);
router.post("/:eventId/bookings", createBooking);
router.post("/:eventId/bookings/:bookingId/confirm", confirmBooking);
router.post("/:eventId/bookings/:bookingId/cancel", cancelBooking);
module.exports = router;