
/**
 * RateLimiter.js
 * Implements a simple queue-based rate limiter to prevent API 429 (Quota Exceeded) errors.
 * Useful for Gemini Free Tier which has strict RPM (Requests Per Minute) limits.
 */

class RateLimiter {
    constructor(requestsPerMinute = 10) {
        this.queue = [];
        this.isProcessing = false;
        // Calculate safe delay: 60s / RPM. 
        // Example: 10 RPM = 6s delay between start of requests approx.
        // We add a safety buffer.
        this.delayMs = Math.ceil((60000 / requestsPerMinute) * 1.1);
        console.log(`[RateLimiter] Initialized with ~${this.delayMs}ms delay between requests.`);
    }

    /**
     * Adds a task to the queue.
     * @param {Function} taskFunction - Async function to execute
     * @returns {Promise<any>} - Result of the task
     */
    async schedule(taskFunction) {
        return new Promise((resolve, reject) => {
            this.queue.push({ taskFunction, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const { taskFunction, resolve, reject } = this.queue.shift();

        try {
            const result = await taskFunction();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            // Wait for the rate limit delay before processing the next item
            if (this.queue.length > 0) {
                console.log(`[RateLimiter] Waiting ${this.delayMs}ms before next request...`);
            }
            setTimeout(() => {
                this.isProcessing = false;
                this.processQueue();
            }, this.delayMs);
        }
    }
}

module.exports = RateLimiter;
