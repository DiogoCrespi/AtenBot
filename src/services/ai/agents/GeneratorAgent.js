
const BaseAgent = require('./BaseAgent');

class GeneratorAgent extends BaseAgent {
    buildPrompt({ message, history }) {
        // Note: The history is injected via the context in generateResponse, 
        // but we can add specific instructions here.
        return `
    ATUAÇÃO: Você é um assistente virtual útil e preciso.
    TAREFA: Responda à mensagem do usuário com base no histórico.
    OBJETIVO: Fornecer a informação correta e útil. Não se preocupe com "polidez excessiva" agora, foque no conteúdo.
    
    MENSAGEM DO USUÁRIO: "${message}"
    `;
    }

    async run(input, context = {}) {
        const prompt = this.buildPrompt(input);
        // We pass context including history so the provider can format it
        return await this.process(prompt, context);
    }
}

module.exports = GeneratorAgent;
