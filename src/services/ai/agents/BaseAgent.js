
/**
 * BaseAgent.js
 * Base class for all AI agents in the pipeline.
 * Designed to support future migration to separate microservices/APIs.
 */
class BaseAgent {
    constructor(name, provider, rateLimiter) {
        this.name = name;
        this.provider = provider;
        this.rateLimiter = rateLimiter;
    }

    /**
     * Process a prompt through the agent using the rate limiter.
     * @param {string} prompt - The prompt to send to the AI.
     * @param {object} context - Additional context (history, etc.).
     * @returns {Promise<string>} - The AI response.
     */
    async process(prompt, context = {}) {
        console.log(`[${this.name}] Processing request...`);

        // Future-proofing: This is where we could switch to an HTTP call 
        // to an external API instead of using the local provider.
        return await this.rateLimiter.schedule(async () => {
            console.log(`[${this.name}] Executing AI generation...`);
            return await this.provider.generateResponse(prompt, context);
        });
    }

    /**
     * Abstract method to construct the specific prompt for this agent.
     * @param {object} input - Input data for the agent.
     */
    buildPrompt(input) {
        throw new Error('Method buildPrompt() must be implemented');
    }
}

module.exports = BaseAgent;
