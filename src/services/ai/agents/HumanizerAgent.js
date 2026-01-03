
const BaseAgent = require('./BaseAgent');

class HumanizerAgent extends BaseAgent {
    buildPrompt(input) {
        return `
    ATUAÇÃO: Especialista em Humanização de Texto para WhatsApp.
    TAREFA: Reescreva o texto do usuário para parecer um SMS rápido.
    
    REGRAS DE OURO (ESTILO SMS/WHATSAPP):
    1. LIMITE ABSOLUTO: 30 PALAVRAS.
    2. Imagine que você está mandando um SMS rápido.
    3. Corte TUDO que não for a informação principal.
    4. Sem "Entendi", "Olá", "Veja bem". Comece respondendo.
    5. Use abreviações comuns se necessário (vc, tbm) para parecer humano.
    
    SAÍDA: Apenas a mensagem reescrita (CURTA).
    `;
    }

    async run(input) {
        const systemRules = this.buildPrompt(input);
        return await this.process(input.draftResponse, {
            systemPrompt: systemRules
        });
    }
}

module.exports = HumanizerAgent;
