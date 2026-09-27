const { Worker } = require("bullmq");

const holdWorker = new Worker(
    "seat-hold",
    async (job) => {
        console.log("Job received:", job.name);
        console.log("Job data:", job.data);
    },
    {
        connection: {
            host: "127.0.0.1",     // ← localhost ki jagah 127.0.0.1
            port: 6379,
        },
    }
);

// Add error handler — important!
holdWorker.on("error", (err) => {
    console.error("Worker error:", err);
});

holdWorker.on("ready", () => {
    console.log("Worker ready");
});

holdWorker.on("failed", (job, err) => {
    console.error("Job failed:", job?.id, err.message);
});