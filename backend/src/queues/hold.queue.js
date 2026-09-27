const { Queue } = require("bullmq");

const holdQueue = new Queue("seat-hold",{
    connection : {
        host : "localhost",
        port : 6379,
    }
});

module.exports = holdQueue;