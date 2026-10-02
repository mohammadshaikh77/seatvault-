const { createClient } = require("redis");

const redisClient = createClient({
    url: "redis://localhost:6379",
});

// Error handler — pehle se tha
redisClient.on("error", (error) => {
    console.error("Redis error:", error);
});

// ✨ NAYA: Connect listener add karo
redisClient.on("connect", () => {
    console.log("Redis se connection ban gaya");
});

// ✨ OPTIONAL: Ready listener bhi add kar sakte ho
redisClient.on("ready", () => {
    console.log("Redis ready — commands bhej sakte ho");
});

// Connection function
const connectRedis = async () => {
    await redisClient.connect();

    console.log("Redis connected (from connectRedis function)");

    await redisClient.set(
    "hold:event:1:seat:2",
    "booking:3",
    {
        EX: 30,
    }
   );
   await redisClient.set(
    "hold:event:1:seat:3",
    "booking:3",
    {
        EX: 30,
    }
   );
   const seat2 = await redisClient.get("hold:event:1:seat:2");
const seat3 = await redisClient.get("hold:event:1:seat:3");


};

module.exports = {
    redisClient,
    connectRedis,
};