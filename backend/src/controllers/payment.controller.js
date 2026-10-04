const { pool } = require("../config/db");
const { redisClient } = require("../config/redis");
const createPayment = async (req, res) => {
    const { bookingId } = req.params;

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
     if (booking.status !== "pending") {
    await client.query("ROLLBACK");

    return res.status(409).json({
        message: `Payment cannot be initiated for a ${booking.status} booking`,
    });
    }
    if (booking.expires_at && new Date(booking.expires_at) <= new Date()) {
    await client.query("ROLLBACK");

    return res.status(409).json({
        message: "Booking has expired",
    });
    }
    const transactionId = `txn_${Date.now()}`;
    const paymentResult = await client.query(
    `INSERT INTO payments (
        booking_id,
        amount,
        payment_method,
        status,
        transaction_id
     )
     VALUES (
        $1,
        $2,
        $3,
        'pending',
        $4
     )
     RETURNING id, booking_id, amount, payment_method, status, transaction_id`,
    [
        booking.id,
        booking.total_amount,
        "mock",
        transactionId,
    ]
    );
    const payment = paymentResult.rows[0];
    await client.query("COMMIT");
    return res.status(201).json({
    message: "Payment initiated",
    payment,
    });
    } 
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};


const handlePaymentWebhook = async (req, res) => {
    const { transactionId, status } = req.body;
    if (!["successful", "failed"].includes(status)) {
    return res.status(400).json({
        message: "Invalid payment status",
    });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

       const result = await client.query(
    `SELECT id, booking_id, amount, payment_method, status, transaction_id
     FROM payments
     WHERE transaction_id = $1
     FOR UPDATE`,
    [transactionId]
     );

     if (result.rows.length === 0) {
    await client.query("ROLLBACK");

    return res.status(404).json({
        message: "Payment not found",
    });
    }
    const payment = result.rows[0];

    if (payment.status === "successful") {
    await client.query("COMMIT");

    return res.status(200).json({
        message: "Payment already processed",
    });
    }

    if (status === "failed") {
    await client.query(
        `UPDATE payments
         SET status = 'failed',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [payment.id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
        message: "Payment marked as failed",
    });
    }

    const bookingResult = await client.query(
    `SELECT id, user_id, event_id, total_amount, status, expires_at
     FROM bookings
     WHERE id = $1
     FOR UPDATE`,
    [payment.booking_id]
    );

    if (bookingResult.rows.length === 0) {
    await client.query("ROLLBACK");

    return res.status(404).json({
        message: "Booking not found",
    });
    }

    const booking = bookingResult.rows[0];

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
    `UPDATE payments
     SET status = 'successful',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [payment.id]
   );

   await client.query(
    `UPDATE bookings
     SET status = 'confirmed',
         expires_at = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [booking.id]
    );

    await client.query(
    `UPDATE event_seats AS es
     SET status = 'booked',
         updated_at = CURRENT_TIMESTAMP
     FROM booking_seats AS bs
     WHERE es.id = bs.event_seat_id
       AND bs.booking_id = $1
       AND es.status = 'held'`,
    [booking.id]
    );

    await client.query("COMMIT");
    await redisClient.del(
    `seatvault:hold:booking:${payment.booking_id}`
);

    return res.status(200).json({
    message: "Payment processed successfully",
});

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    createPayment,
    handlePaymentWebhook,
};