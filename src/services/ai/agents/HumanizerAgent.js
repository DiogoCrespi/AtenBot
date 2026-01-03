
const BaseAgent = require('./BaseAgent');

class HumanizerAgent extends BaseAgent {
    buildPrompt({ draftResponse }) {
        return `
    ATUAÇÃO: Especialista em Humanização de Texto para WhatsApp.
    TAREFA: Reescreva o texto abaixo para parecer que foi escrito por um humano prestativo no WhatsApp.
    
    TEXTO ORIGINAL: "${draftResponse}"
    
    REGRAS DE OURO:
    1. Remova pedidos de desculpas desnecessários ("Peço desculpas", "Sinto muito").
    2. Remova introduções robóticas ("Como um assistente de IA...", "Com base nas informações...").
    3. Seja direto, cordial e use linguagem natural (PT-BR).
    4. Pode usar emojis moderadamente se fizer sentido.
    5. Mantenha a informação correta.
    
    SAÍDA: Apenas a mensagem reescrita.
    `;
    }

    async run(input) {
        const prompt = this.buildPrompt(input);
        return await this.process(prompt);
    }
}

module.exports = HumanizerAgent;
