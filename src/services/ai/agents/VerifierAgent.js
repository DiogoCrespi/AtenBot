
const BaseAgent = require('./BaseAgent');

class VerifierAgent extends BaseAgent {
    buildPrompt() {
        return `
    ATUAÇÃO: Supervisor de Qualidade.
    TAREFA: Verifique se o rascunho da resposta atende à mensagem do usuário de forma coerente.
    INSTRUÇÕES:
    1. Se a resposta for coerente e útil, responda apenas: "APROVADO".
    2. Se houver alucinação ou erro grave, reescreva a resposta corrigida.
    SAÍDA APENAS O RESULTADO FINAL (APROVADO ou A RESPOSTA CORRIGIDA).
    `;
    }

    async run(input) {
        const systemRules = this.buildPrompt();
        const content = `MENSAGEM ORIGINAL: "${input.originalMessage}"\nRASCUNHO DA RESPOSTA: "${input.draftResponse}"`;

        const response = await this.process(content, { systemPrompt: systemRules });

        if (response.trim().toUpperCase().includes('APROVADO')) {
            return input.draftResponse;
        }
        return response; // Return the corrected version
    }
}

module.exports = VerifierAgent;
