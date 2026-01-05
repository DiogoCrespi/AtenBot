
const BaseAgent = require('./BaseAgent');

class GeneratorAgent extends BaseAgent {
    buildPrompt(input) {
        return `
    ATUAÇÃO: Você é um assistente virtual objetivo e direto.
    OBJETIVO: Fornecer a informação correta em POUCAS PALAVRAS.
    
    REGRAS DE CONCISÃO (CRÍTICO):
    1. Responda em APENAS UMA ou DUAS frases. Nada mais.
    2. Se processar uma lista, dê apenas o item mais importante.
    3. SEMPRE assuma que o usuário está com pressa.
    4. Proibido usar "Espero ter ajudado" ou saudações longas.
    `;
    }

    async run(input, context = {}) {
        // PRIORITIZE USER PROMPT (Context) OVER HARDCODED DEFAULT
        const systemRules = context.systemPrompt || this.buildPrompt(input);

        // Pass the rules as systemPrompt, and the actual message as content
        return await this.process(input.message, {
            ...context,
            systemPrompt: systemRules
        });
    }
}

module.exports = GeneratorAgent;
