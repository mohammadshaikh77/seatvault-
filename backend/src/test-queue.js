const holdQueue = require("./queues/hold.queue");

const addTestJob = async () => {
    const job = await holdQueue.add(
        "test-hold",
        {
            message: "Hello from SeatVault",
        },
        {
            delay: 10000,
        }
    );

    console.log("Job added:", job.id);

    await holdQueue.close();
};

addTestJob();