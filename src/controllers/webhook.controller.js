const aiManager = require('../services/ai/AIManager');
const evolutionService = require('../services/evolution.service');

// Map simplistic (in-memory) to track processing to avoid loops? 
// Ideally use Redis in production as per docs.

class WebhookController {
    constructor() {
        this.processedMessages = new Set();
    }

    async handleWebhook(req, res) {
        try {
            console.log('DEBUG: Webhook Received Headers:', JSON.stringify(req.headers));
            console.log('DEBUG: Webhook Received Body:', JSON.stringify(req.body, null, 2));
            const { type, data, instance, event } = req.body;
            // Support both 'type' and 'event' (Evolution versions vary)
            const eventType = type || event;

            console.log('DEBUG: Parsed eventType:', eventType);

            // 1. Basic Validation
            if (!eventType || !data) {
                console.log('DEBUG: Invalid Payload - missing eventType or data');
                return res.status(400).json({ status: 'ignored', reason: 'invalid_payload' });
            }

            // 2. Ignore non-message events or messages from me
            if (eventType !== 'messages.upsert' && eventType !== 'MESSAGES_UPSERT') {
                console.log('DEBUG: Ignored event type:', eventType);
                return res.status(200).json({ status: 'ignored', reason: 'not_upsert' });
            }

            const messageKey = data.key;
            if (this.processedMessages.has(messageKey.id)) {
                console.log('DEBUG: Duplicate message ignored:', messageKey.id);
                return res.status(200).json({ status: 'ignored', reason: 'duplicate' });
            }
            this.processedMessages.add(messageKey.id);
            // Cleanup cache after 10s
            setTimeout(() => this.processedMessages.delete(messageKey.id), 10000);
            const fromMe = messageKey.fromMe;

            if (fromMe) {
                return res.status(200).json({ status: 'ignored', reason: 'from_me' });
            }

            // 3. Extract Info
            const remoteJid = messageKey.remoteJid; // The user phone number
            const pushName = data.pushName || 'Usuário';
            const messageContent = data.message?.conversation || data.message?.extendedTextMessage?.text || '';

            if (!messageContent) {
                // Could be audio/image/sticker. Doing text-only for MVP refactor first safely.
                return res.status(200).json({ status: 'ignored', reason: 'no_text_content' });
            }

            console.log(`[Message] Instance: ${instance} | User: ${pushName} (${remoteJid}) | Msg: ${messageContent}`);

            // 4. Send "Composing" or processing status (Optional/Async)
            // await evolutionService.sendPresence(instance, remoteJid, 'composing');

            // 5. AI Processing (This should ideally be queued)
            // Using existing AIManager logic logic, but we need to adapt it.
            // Assuming AIManager has a method to process text.
            // We wrap this in a background promise so we don't timeout the webhook

            this.processBackground(instance, remoteJid, pushName, messageContent);

            return res.status(200).json({ status: 'queued' });

        } catch (error) {
            console.error('Webhook Error:', error);
            return res.status(500).json({ error: 'internal_error' });
        }
    }

    async processBackground(instance, remoteJid, pushName, message) {
        try {
            // Calling the AI Service
            // Note: We need to ensure we pass the 'instance' (tenant) context if we want multi-tenancy db
            const responseText = await aiManager.processMessage({
                userId: remoteJid, // Mapping phone to userId for now
                userName: pushName,
                message: message,
                tenantId: instance
            });

            if (responseText) {
                await evolutionService.sendText(instance, remoteJid, responseText);
            }
        } catch (err) {
            console.error(`Error processing background message for ${remoteJid}:`, err);
            await evolutionService.sendText(instance, remoteJid, "Só um momento, já atenderemos.");
        }
    }

}

module.exports = new WebhookController();
