const { Worker } = require("bullmq");
const { pool } = require("../config/db");

const holdWorker = new Worker(
    "seat-hold",
    async (job) => {
        console.log("Job received:", job.name);
        console.log("Job data:", job.data);

        const { bookingId } = job.data;

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            // Get the latest booking state and lock it
            const result = await client.query(
                `SELECT id, user_id, event_id, total_amount, status
                 FROM bookings
                 WHERE id = $1
                 FOR UPDATE`,
                [bookingId]
            );

            if (result.rows.length === 0) {
                console.log("Booking not found");
                await client.query("ROLLBACK");
                return;
            }

            const booking = result.rows[0];

            console.log("Booking found:", booking);

            // If booking is no longer pending,
            // there is nothing to expire.
            if (booking.status !== "pending") {
                console.log(
                    `Booking ${bookingId} is ${booking.status}. No action needed.`
                );

                await client.query("COMMIT");
                return;
            }

            // Expire the booking
            await client.query(
                `UPDATE bookings
                 SET status = 'expired',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [bookingId]
            );

            // Release all seats belonging to this booking
            await client.query(
                `UPDATE event_seats
                 SET status = 'available',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id IN (
                     SELECT event_seat_id
                     FROM booking_seats
                     WHERE booking_id = $1
                 )
                 AND status = 'held'`,
                [bookingId]
            );

            await client.query("COMMIT");

            console.log(`Booking ${bookingId} expired`);
            console.log(`Seats for booking ${bookingId} released`);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    },
    {
        connection: {
            host: "localhost",
            port: 6379,
        },
    }
);

holdWorker.on("completed", (job) => {
    console.log("Job completed:", job.id);
});

holdWorker.on("failed", (job, error) => {
    console.error("Job failed:", job?.id, error.message);
});