
const BaseAgent = require('./BaseAgent');

class VerifierAgent extends BaseAgent {
    buildPrompt({ originalMessage, draftResponse }) {
        return `
    ATUAÇÃO: Supervisor de Qualidade.
    TAREFA: Verifique se o rascunho da resposta atende à mensagem do usuário de forma coerente.
    
    MENSAGEM ORIGINAL: "${originalMessage}"
    RASCUNHO DA RESPOSTA: "${draftResponse}"
    
    INSTRUÇÕES:
    1. Se a resposta for coerente e útil, responda apenas: "APROVADO".
    2. Se houver alucinação ou erro grave, reescreva a resposta corrigida.
    
    SAÍDA APENAS O RESULTADO FINAL (APROVADO ou A RESPOSTA CORRIGIDA).
    `;
    }

    async run(input) {
        const prompt = this.buildPrompt(input);
        const response = await this.process(prompt); // No history context needed for verification usually, strictly logic check

        if (response.trim().toUpperCase().includes('APROVADO')) {
            return input.draftResponse;
        }
        return response; // Return the corrected version
    }
}

module.exports = VerifierAgent;
