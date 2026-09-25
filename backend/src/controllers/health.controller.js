const { pool } = require("../config/db");

const checkDatabase = async (req,res) => {
    const result = await pool.query("SELECT current_database()");
    res.json({
        message : "Database connection is working",
        database : result.rows[0].current_database,
    });
}

module.exports = {
    checkDatabase,
};