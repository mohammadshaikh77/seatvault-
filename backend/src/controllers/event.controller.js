const { pool } = require("../config/db");

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

module.exports = {
    getAvailableSeats,
    holdSeat,
};