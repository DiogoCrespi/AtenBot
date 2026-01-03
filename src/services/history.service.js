
const { Conversation, Message, User } = require('../models');
const { Op } = require('sequelize');

class HistoryService {

    /**
     * Ensures a conversation exists for a given phone number.
     * Links to the first found User (Tenant) if no specific mapping exists yet.
     */
    async _getConversation(phoneNumber, instanceName) {
        let conversation = await Conversation.findOne({ where: { phoneNumber } });

        if (!conversation) {
            // MVP Hack: Assign to the first available user (Tenant)
            // In a real SaaS, we would map instanceName -> Tenant User
            const defaultUser = await User.findOne();

            if (!defaultUser) {
                throw new Error('No Tenant User found in DB to link conversation. Please seed a user.');
            }

            conversation = await Conversation.create({
                userId: defaultUser.id,
                phoneNumber: phoneNumber,
                status: 'active',
                metadata: { sourceInstance: instanceName }
            });
        }
        return conversation;
    }

    /**
     * Adds a message to the history.
     * @param {string} phoneNumber - The user's phone number (remoteJid).
     * @param {string} content - The message text.
     * @param {string} direction - 'incoming' (User) or 'outgoing' (Bot).
     * @param {string} instanceName - The Evolution instance name.
     */
    async addMessage(phoneNumber, content, direction, instanceName) {
        try {
            const conversation = await this._getConversation(phoneNumber, instanceName);

            const message = await Message.create({
                conversationId: conversation.id,
                direction: direction,
                content: content,
                type: 'text',
                status: direction === 'incoming' ? 'received' : 'sent',
                metadata: {
                    timestamp: new Date()
                }
            });

            console.log(`[History] Saved ${direction} message for ${phoneNumber}`);
            return message;
        } catch (error) {
            console.error('[History] Error saving message:', error);
            // We don't block the flow if history fails, just log it.
        }
    }

    /**
     * Retrieves the latest N messages for context.
     * Formats them for the AI (User: ... Bot: ...).
     */
    async getHistory(phoneNumber, limit = 10) {
        try {
            const conversation = await Conversation.findOne({ where: { phoneNumber } });
            if (!conversation) return [];

            const messages = await Message.findAll({
                where: { conversationId: conversation.id },
                order: [['createdAt', 'DESC']], // Get newest first
                limit: limit
            });

            // Reverse to chronological order (oldest -> newest)
            return messages.reverse().map(msg => ({
                role: msg.direction === 'incoming' ? 'user' : 'model',
                content: msg.content
            }));
        } catch (error) {
            console.error('[History] Error fetching history:', error);
            return [];
        }
    }
}

module.exports = new HistoryService();
