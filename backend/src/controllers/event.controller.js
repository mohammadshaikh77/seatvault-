const { pool } = require("../config/db");
const holdQueue = require("../queues/hold.queue");
const { redisClient } = require("../config/redis");

const getAvailableSeats = async (req, res) => {
    const { eventId } = req.params;

    const result = await pool.query(
        `SELECT
            events.name AS event_name,
            seats.section,
            seats.row_label,
            seats.seat_number,
            event_seats.price,
            event_seats.status
         FROM event_seats
         JOIN events
            ON event_seats.event_id = events.id
         JOIN seats
            ON event_seats.seat_id = seats.id
         WHERE event_seats.event_id = $1
           AND event_seats.status = 'available'`,
        [eventId]
    );

    res.json({
        event: result.rows.length > 0
            ? result.rows[0].event_name
            : null,
        availableSeats: result.rows,
    });
};

const holdSeat = async (req, res) => {
    const { eventSeatId } = req.params;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT id, status, price
             FROM event_seats
             WHERE id = $1
             FOR UPDATE`,
            [eventSeatId]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Seat not found",
            });
        }

        const seat = result.rows[0];

        if (seat.status !== "available") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "Seat is not available",
            });
        }

        await client.query(
            `UPDATE event_seats
             SET status = 'held',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [eventSeatId]
        );

        await client.query("COMMIT");

        res.json({
            message: "Seat held successfully",
            seat: {
                id: seat.id,
                price: seat.price,
                status: "held",
            },
        });

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};

const createBooking = async (req, res) => {
    const { eventId } = req.params;
    const { userId, seatIds } = req.body;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const sortedSeatIds = [...seatIds].sort((a, b) => a - b);

        const result = await client.query(
            `SELECT id, seat_id, price, status
             FROM event_seats
             WHERE event_id = $1
               AND seat_id = ANY($2)
             ORDER BY seat_id
             FOR UPDATE`,
            [eventId, sortedSeatIds]
        );

        if (result.rows.length !== sortedSeatIds.length) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "One or more seats do not belong to this event",
            });
        }

        const unavailableSeat = result.rows.find(
            (seat) => seat.status !== "available"
        );

        if (unavailableSeat) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "One or more seats are not available",
                seatId: unavailableSeat.seat_id,
                status: unavailableSeat.status,
            });
        }

        let totalAmount = 0;

        for (let i = 0; i < result.rows.length; i++) {
          totalAmount += Number(result.rows[i].price);
        }

        console.log(totalAmount);  


        const bookingResult = await client.query(
    `INSERT INTO bookings (
        user_id,
        event_id,
        total_amount,
        status,
        expires_at
    )
    VALUES (
        $1,
        $2,
        $3,
        'pending',
        CURRENT_TIMESTAMP + INTERVAL '10 minutes'
    )
    RETURNING id, user_id, event_id, total_amount, status, expires_at`,
    [userId, eventId, totalAmount]
);

       const booking = bookingResult.rows[0];

       

    console.log("Booking expires at:", booking.expires_at);

       console.log("Created booking:", booking);

       for (const seat of result.rows) {
          await client.query(
          `INSERT INTO booking_seats (
            booking_id,
            event_seat_id,
            price_at_booking
           )
         VALUES ($1, $2, $3)`,
        [
            booking.id,
            seat.id,
            seat.price,
        ]
    );
}

    await client.query(
    `UPDATE event_seats
     SET status = 'held',
         updated_at = CURRENT_TIMESTAMP
     WHERE event_id = $1
       AND seat_id = ANY($2)`,
    [eventId, sortedSeatIds]
);

        console.log("All seats are available:", result.rows);

        await client.query("COMMIT");

        await redisClient.set(
    `seatvault:hold:booking:${booking.id}`,
    JSON.stringify({
        bookingId: booking.id,
        eventId: Number(eventId),
        seatIds: sortedSeatIds,
    }),
    {
        EX: 600,
    }
      );

      

        const delayMs =
    new Date(booking.expires_at).getTime() - Date.now();

     await holdQueue.add(
    "release-hold",
    {
        bookingId: booking.id,
    },
    {
        delay: delayMs,
    }
    );



    res.json({
    message: "Booking and booking seats created",
    booking,
    seats: result.rows,
});

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};


const confirmBooking = async (req, res) => {
    const { eventId, bookingId } = req.params;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const result = await client.query(
        `SELECT id, user_id, event_id, total_amount, status, expires_at
         FROM bookings
         WHERE id = $1
         FOR UPDATE`,
        [bookingId]
        );
        if (result.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
        message: "Booking not found",
       });
     }
     const booking = result.rows[0];
     if (Number(booking.event_id) !== Number(eventId)) {
    await client.query("ROLLBACK");

    return res.status(400).json({
        message: "Booking does not belong to this event",
    });
    }
    if (booking.status !== "pending") {
    await client.query("ROLLBACK");

    return res.status(409).json({
        message: `Booking cannot be confirmed because it is ${booking.status}`,
    });
    }
    if (booking.expires_at && new Date(booking.expires_at) <= new Date()) {
    await client.query("ROLLBACK");

    return res.status(409).json({
        message: "Booking has expired",
    });
    }
    await client.query(
    `UPDATE bookings
     SET status = 'confirmed',
         expires_at = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [bookingId]
    );
    await client.query(
    `UPDATE event_seats AS es
     SET status = 'booked',
         updated_at = CURRENT_TIMESTAMP
     FROM booking_seats AS bs
     WHERE es.id = bs.event_seat_id
       AND bs.booking_id = $1
       AND es.status = 'held'`,
    [bookingId]
    );
    await client.query("COMMIT");
    return res.status(200).json({
    message: "Booking confirmed successfully",
    bookingId: booking.id,
    });
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
module.exports = {
    getAvailableSeats,
    holdSeat,
    createBooking,
    confirmBooking,
};