const GeminiProvider = require('./providers/GeminiProvider');
require('dotenv').config();

class AIManager {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
  }

  registerProvider(name, provider) {
    this.providers.set(name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  setDefaultProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`Provedor ${name} não registrado`);
    }
    this.defaultProvider = name;
  }

  getProvider(name = null) {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Provedor ${providerName} não encontrado`);
    }

    return provider;
  }

  async generateResponse(message, context = {}, providerName = null) {
    const provider = this.getProvider(providerName);
    return await provider.generateResponse(message, context);
  }
}

const RateLimiter = require('../../utils/RateLimiter');

// Define rate limit for Gemini Free Tier (e.g., 6 RPM to be very safe, or 10)
const rateLimiter = new RateLimiter(6);

// Singleton instance
const aiManager = new AIManager();

// Configuration centralization
// We trust process.env as the source of truth
const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000'),
  temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
};

console.log('Configuração do Gemini (AIManager):', {
  ...geminiConfig,
  apiKey: geminiConfig.apiKey ? '***Configurada***' : 'Não configurada'
});

const geminiProvider = new GeminiProvider(geminiConfig);
aiManager.registerProvider('gemini', geminiProvider);

// Override processMessage to use RateLimiter
aiManager.processMessage = async function ({ userId, userName, message, tenantId }) {
  console.log(`AI Processing Request Queued for ${userId} [${userName}]`);

  return await rateLimiter.schedule(async () => {
    console.log(`AI Processing Started for ${userId}`);
    return await this.generateResponse(message, { userId, userName });
  });
};

// Add adapter for WebhookController
aiManager.processMessage = async function ({ userId, userName, message, tenantId }) {
  console.log(`AI Processing for ${userId} [${userName}]`);
  // Pass minimal context. In future, we could load history from DB here.
  return await this.generateResponse(message, { userId, userName });
};

module.exports = aiManager; 