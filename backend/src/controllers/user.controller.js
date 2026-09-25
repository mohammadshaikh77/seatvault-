const { pool } = require("../config/db");

const getUsers = async (req, res) => {
    const result = await pool.query(
        "SELECT id, name, email, role FROM users"
    );

    res.json({
        users: result.rows,
    });
};

const getUserById = async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
        "SELECT id, name, email, role FROM users WHERE id = $1",
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            message: "User not found",
        });
    }

    res.json({
        user: result.rows[0],
    });
};

const createUser = async (req, res) => {
    const { name, email, password_hash, role } = req.body;

    const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        [name, email, password_hash, role]
    );

    res.status(201).json({
        user: result.rows[0],
    });
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
};