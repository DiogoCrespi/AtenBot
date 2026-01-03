
/**
 * BaseAgent.js
 * Base class for all AI agents in the pipeline.
 * Designed to support future migration to separate microservices/APIs.
 */
class BaseAgent {
    constructor(name, provider) {
        this.name = name;
        this.provider = provider;
    }

    /**
     * Process a prompt through the agent.
     * @param {string} prompt - The prompt to send to the AI.
     * @param {object} context - Additional context (history, etc.).
     * @returns {Promise<string>} - The AI response.
     */
    async process(prompt, context = {}) {
        console.log(`[${this.name}] Processing request...`);
        // Direct execution (Concurrency handled by BullMQ now)
        return await this.provider.generateResponse(prompt, context);
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
