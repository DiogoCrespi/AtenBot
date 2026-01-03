const QueueService = require('../services/queue/QueueService');

// Simple In-Memory Deduplication for Webhook Retries
const processedMessages = new Set();

class WebhookController {
    async handleWebhook(req, res) {
        try {
            const { event, instance, data, sender } = req.body;
            // Support both 'type' and 'event' (Evolution versions vary)
            const eventType = req.body.type || event;

            // 1. Security & Basic Filters
            const apiKey = req.headers['apikey'] || req.headers['x-api-key'];
            const validKey = process.env.EVOLUTION_API_KEY || 'atenbot-global-key';

            // Optional: Enable strict checking if env var is set
            if (process.env.WEBHOOK_SECURITY_ENABLED === 'true' && apiKey !== validKey) {
                return res.status(401).json({ status: 'unauthorized' });
            }

            if (!eventType || !data) {
                return res.status(200).json({ status: 'ignored_invalid' });
            }
            if (eventType !== 'messages.upsert' && eventType !== 'MESSAGES_UPSERT') {
                return res.status(200).json({ status: 'ignored_type' });
            }
            if (data.key.fromMe) {
                return res.status(200).json({ status: 'ignored_from_me' });
            }

            // 2. Extract Data
            const remoteJid = data.key.remoteJid;
            const pushName = data.pushName || sender || 'Usuário';
            const message = data.message;
            const messageId = data.key.id;

            // Deduplication Check
            if (processedMessages.has(messageId)) {
                console.log(`[Webhook] Ignoring Duplicate Message ID: ${messageId}`);
                return res.status(200).json({ status: 'ignored_duplicate' });
            }
            processedMessages.add(messageId);
            // Clear from memory after 60 seconds
            setTimeout(() => processedMessages.delete(messageId), 60000);

            // 3. Audio Detection (Base64 Strategy)
            const isAudio = !!message.audioMessage;
            let base64Audio = null;

            if (isAudio && message.audioMessage?.base64) {
                base64Audio = message.audioMessage.base64;
            } else if (isAudio) {
                console.log('[Webhook DEBUG] Audio Message Keys:', Object.keys(message.audioMessage));
            }

            console.log(`[Webhook] Enqueuing Job: ${pushName} (${remoteJid}) - Audio: ${isAudio}`);

            // 4. FIRE AND FORGET (Queue)
            await QueueService.addJob({
                remoteJid,
                pushName,
                message,
                isAudio,
                base64Audio,
                instance
            });

            // 5. Zero Latency Response
            return res.status(200).json({ status: 'queued' });

        } catch (error) {
            console.error('Webhook Error:', error);
            // Always return 200 to prevent WhatsApp retries on our internal errors
            return res.status(200).json({ status: 'error_handled' });
        }
    }
}

module.exports = new WebhookController();
