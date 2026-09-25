const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`SeatVault server running on port ${PORT}`);
    });
};

startServer();