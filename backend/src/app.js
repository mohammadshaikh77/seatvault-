const express = require("express");
const healthRoutes = require("./routes/health.route");
const userRoutes = require("./routes/user.routes");
const app = express();

app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/users", userRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to SeatVault API",
    });
});

module.exports = app;