const { Worker } = require('bullmq');
const MultiAgentService = require('../ai/MultiAgentService');
const HistoryService = require('../history.service');
const GeminiProvider = require('../ai/providers/GeminiProvider');
const axios = require('axios');

// Initialize Dependencies for the Worker
// Note: We create new instances here to ensure isolation or reuse existing ones if singleton pattern was stricter.
// For now, new instances are safe.
const geminiConfig = {
    apiKey: process.env.GEMINI_API_KEY,
    apiKeyBackup: process.env.GEMINI_API_KEY_BACKUP,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8000'),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
};

const geminiProvider = new GeminiProvider(geminiConfig);
const multiAgentService = new MultiAgentService(geminiProvider);

// Redis Connection
const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379')
};

class WorkerService {
    constructor() {
        this.worker = new Worker('atenbot-queue', async (job) => {
            await this.processJob(job);
        }, { connection, concurrency: 5 }); // Process 5 chats in parallel

        this.worker.on('completed', (job) => {
            console.log(`[Worker] Job ${job.id} completed!`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`[Worker] Job ${job.id} failed: ${err.message}`);
        });

        console.log('[WorkerService] Listener Initialized');
    }

    async processJob(job) {
        let { remoteJid, pushName, message, isAudio, base64Audio, instance } = job.data;
        console.log(`[Worker] Processing job for ${pushName} (${remoteJid}) on instance ${instance}`);

        try {
            // 1. Send "Composing" presence
            await this.sendPresence(remoteJid, isAudio ? 'recording' : 'composing', instance);

            let responseText = '';


            if (isAudio) {
                // FALLBACK: If Base64 is missing, try to download from URL
                if (!base64Audio && message.audioMessage?.url) {
                    try {
                        console.log(`[Worker] Downloading audio from URL: ${message.audioMessage.url}`);
                        const response = await axios.get(message.audioMessage.url, {
                            responseType: 'arraybuffer',
                            headers: { 'apikey': process.env.EVOLUTION_API_KEY } // Just in case it's an authenticated route
                        });
                        job.data.base64Audio = Buffer.from(response.data, 'binary').toString('base64'); // Update job data for consistency
                        base64Audio = job.data.base64Audio; // Update local variable
                        console.log('[Worker] Audio downloaded and converted to Base64 successfully.');
                    } catch (err) {
                        console.error(`[Worker] Failed to download audio: ${err.message}`);
                    }
                }

                if (base64Audio) {
                    // AUDIO PROCESSING
                    console.log(`[Worker] Processing Audio message...`);

                    // Fetch History for Context (Critical for "irrelevant" responses)
                    const history = await HistoryService.getHistory(remoteJid, 5);

                    const audioPrompt = `O usuário ${pushName} enviou este áudio. Ouça com atenção, transcreva mentalmente e responda à pergunta ou comentário. Se for apenas ruído ou silêncio, diga que não entendeu.`;

                    const audioContent = [
                        { text: audioPrompt },
                        { inlineData: { mimeType: "audio/ogg", data: base64Audio } }
                    ];

                    // Direct Provider Call for Audio
                    responseText = await geminiProvider.generateResponse(null, {
                        history: history,
                        systemPrompt: `Você é o AtenBot, assistente jurídico. O usuário se chama ${pushName}. Responda ao áudio de forma direta, curta e natural (estilo WhatsApp). Se o áudio referir a mensagens anteriores, use o histórico.`,
                        multimodal: audioContent
                    });
                } else {
                    console.warn(`[Worker] Audio received but Base64 is MISSING and Download Failed.`);
                    responseText = "recebi seu áudio, mas por uma falha técnica não consegui escutar. Pode escrever ou tentar mandar de novo?";
                }
            } else {
                // TEXT PROCESSING (Standard Pipeline)
                const text = message.conversation || message.extendedTextMessage?.text;
                if (!text) {
                    console.log('[Worker] No text content found. Skipping.');
                    return;
                }

                // 2. CHECK IF BOT IS ACTIVE
                const { User } = require('../../models');
                // MVP: Fetch the first user (Admin)
                const user = await User.findOne();

                if (!user) {
                    console.error('[Worker] No user found to process message.');
                    return;
                }

                if (user.isActive === false) {
                    console.log(`[Worker] Bot is INACTIVE for user ${user.name}. Ignoring message.`);
                    return;
                }

                console.log(`[Worker] Text Message Received: ${text}`);

                // 3. FETCH HISTORY
                const history = await HistoryService.getHistory(remoteJid, 10);

                // 4. GENERATE AI RESPONSE
                // Use dynamic system prompt from user settings
                const systemPrompt = user.settings?.systemPrompt || "Você é o AtenBot, um assistente inteligente. Responda de forma útil e curta.";

                responseText = await multiAgentService.processPipeline(text, {
                    userId: remoteJid,
                    userName: pushName,
                    history: history,
                    systemPrompt: systemPrompt
                });
            }

            // 3. Send Response via Evolution API
            if (responseText) {
                await this.sendMessage(remoteJid, responseText, instance);
            }

        } catch (error) {
            console.error(`[Worker] Failed to process message for ${remoteJid}:`, error);
            throw error; // Trigger BullMQ retry
        }
    }

    async sendPresence(remoteJid, status, instanceName) {
        try {
            const instance = instanceName || process.env.EVOLUTION_INSTANCE || 'atenbot';
            await axios.post(`${process.env.EVOLUTION_API_URL}/chat/sendPresence/${instance}`, {
                number: remoteJid,
                presence: status,
                delay: 1200
            }, {
                headers: { 'apikey': process.env.EVOLUTION_API_KEY }
            });
        } catch (e) {
            // Ignore presence errors
        }
    }

    async sendMessage(remoteJid, text, instanceName) {
        try {
            const instance = instanceName || process.env.EVOLUTION_INSTANCE || 'atenbot';
            await axios.post(`${process.env.EVOLUTION_API_URL}/message/sendText/${instance}`, {
                number: remoteJid,
                text: text
            }, {
                headers: { 'apikey': process.env.EVOLUTION_API_KEY }
            });
            console.log(`[Worker] Response sent to ${remoteJid} via ${instance}`);
        } catch (error) {
            console.error(`[Worker] Error sending response:`, error.message);
        }
    }
}

module.exports = new WorkerService();
