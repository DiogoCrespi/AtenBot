
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Redis Connection Config
const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379')
};

// Create a shared Redis client for manual operations (Buffering)
const redisClient = new IORedis(connection);

// Initialize Queue
const messageQueue = new Queue('atenbot-queue', { connection });

console.log('[QueueService] AtenBot Queue Initialized connected to', connection.host);

module.exports = {
    redisClient, // Export raw client
    /**
     * Adds a job to the queue (Fire-and-Forget)
     * @param {Object} data - The message payload
     */
    async addJob(data) {
        try {
            await messageQueue.add('chat-job', data, {
                removeOnComplete: true,
                removeOnFail: 50, // Keep last 50 failed jobs for debugging
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            });
            // console.log(`[Queue] Job enqueued for ${data.remoteJid}`);
        } catch (error) {
            console.error('[Queue] Error adding job:', error);
        }
    }
};
