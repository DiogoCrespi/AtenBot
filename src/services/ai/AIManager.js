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

// Singleton instance
const aiManager = new AIManager();

// Registra o provedor Gemini por padrão
const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash',
  maxTokens: 1000,
  temperature: 0.7,
  topK: 40,
  topP: 0.95
};

// Log para debug
console.log('Configuração do Gemini:', {
  apiKey: geminiConfig.apiKey ? 'Configurada' : 'Não configurada',
  model: geminiConfig.model,
  maxTokens: geminiConfig.maxTokens,
  temperature: geminiConfig.temperature
});

const geminiProvider = new GeminiProvider(geminiConfig);
aiManager.registerProvider('gemini', geminiProvider);

// Add adapter for WebhookController
aiManager.processMessage = async function ({ userId, userName, message, tenantId }) {
  console.log(`AI Processing for ${userId} [${userName}]`);
  // Pass minimal context. In future, we could load history from DB here.
  return await this.generateResponse(message, { userId, userName });
};

module.exports = aiManager; 