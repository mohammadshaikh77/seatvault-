const { pool } = require("../config/db");
const crypto = require("crypto");

const createTicket = async (req, res) => {
    const { bookingId, bookingSeatId } = req.params;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Find and lock the booking
        const result = await client.query(
            `SELECT id, user_id, event_id, total_amount, status
             FROM bookings
             WHERE id = $1
             FOR UPDATE`,
            [bookingId]
        );

        // 2. Booking must exist
        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Booking not found",
            });
        }

        const booking = result.rows[0];

        // 3. Booking must be confirmed
        if (booking.status !== "confirmed") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: `Ticket cannot be created because booking is ${booking.status}`,
            });
        }

        // 4. Find the booking seat
        //    Also make sure it actually belongs to this booking
        const bookingSeatResult = await client.query(
            `SELECT id, booking_id, event_seat_id, price_at_booking
             FROM booking_seats
             WHERE id = $1
               AND booking_id = $2`,
            [bookingSeatId, bookingId]
        );

        // 5. Booking seat must belong to this booking
        if (bookingSeatResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Booking seat not found for this booking",
            });
        }

        const bookingSeat = bookingSeatResult.rows[0];

        // 6. Check whether this booking seat already has a ticket
        const existingTicketResult = await client.query(
            `SELECT id, booking_id, booking_seat_id, ticket_code, status
             FROM tickets
             WHERE booking_seat_id = $1
             FOR UPDATE`,
            [bookingSeat.id]
        );

        // 7. If ticket already exists, return it
        if (existingTicketResult.rows.length > 0) {
            await client.query("COMMIT");

            return res.status(200).json({
                message: "Ticket already exists",
                ticket: existingTicketResult.rows[0],
            });
        }

        // 8. Generate unique ticket code
        const ticketCode = `TKT-${crypto
            .randomBytes(8)
            .toString("hex")
            .toUpperCase()}`;

        // 9. Create the ticket
        const ticketResult = await client.query(
            `INSERT INTO tickets (
                booking_id,
                booking_seat_id,
                ticket_code,
                qr_code_data,
                status
             )
             VALUES ($1, $2, $3, $4, 'valid')
             RETURNING
                id,
                booking_id,
                booking_seat_id,
                ticket_code,
                qr_code_data,
                status,
                issued_at`,
            [
                booking.id,
                bookingSeat.id,
                ticketCode,
                ticketCode,
            ]
        );

        // 10. Commit transaction
        await client.query("COMMIT");

        // 11. Return created ticket
        return res.status(201).json({
            message: "Ticket created successfully",
            ticket: ticketResult.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    createTicket,
};