const GeneratorAgent = require('./agents/GeneratorAgent');
const VerifierAgent = require('./agents/VerifierAgent');
const HumanizerAgent = require('./agents/HumanizerAgent');
const HistoryService = require('../history.service'); // Import HistoryService

class MultiAgentService {
    constructor(provider) {
        this.generator = new GeneratorAgent('Generator', provider);
        this.verifier = new VerifierAgent('Verifier', provider);
        this.humanizer = new HumanizerAgent('Humanizer', provider);
    }

    async processPipeline(message, context) {
        console.log('--- Iniciando Pipeline Multi-Agente ---');
        const { userId, userName } = context;

        // 0. Save User Message
        // userId is effectively the phoneNumber (remoteJid) in our current logic
        await HistoryService.addMessage(userId, message, 'incoming', 'default');

        // 1. Fetch History (Limit 6 to prevent overload)
        const history = await HistoryService.getHistory(userId, 6);
        console.log(`[Pipeline] Context loaded: ${history.length} previous messages.`);

        const startTime = Date.now();

        // 2. Generation Phase (Pass History in Context)
        const draft = await this.generator.run({ message }, { history });
        console.log(`[Pipeline] Draft: ${draft.substring(0, 50)}...`);

        // 3. Verification Phase
        const verifiedDraft = await this.verifier.run({
            originalMessage: message,
            draftResponse: draft
        });

        // 4. Humanization Phase
        const finalResponse = await this.humanizer.run({
            draftResponse: verifiedDraft
        });
        console.log(`[Pipeline] Final Response: ${finalResponse.substring(0, 50)}...`);

        // 5. Save Bot Response
        await HistoryService.addMessage(userId, finalResponse, 'outgoing', 'default');

        const duration = (Date.now() - startTime) / 1000;
        console.log(`--- Pipeline Concluído em ${duration}s ---`);

        return finalResponse;
    }
}

module.exports = MultiAgentService;
