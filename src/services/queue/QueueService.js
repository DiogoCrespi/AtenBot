
const { Queue } = require('bullmq');

// Redis Connection Config
const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379')
};

// Initialize Queue
const messageQueue = new Queue('atenbot-queue', { connection });

console.log('[QueueService] AtenBot Queue Initialized connected to', connection.host);

module.exports = {
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
