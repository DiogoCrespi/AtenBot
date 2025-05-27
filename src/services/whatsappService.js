const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Message, Conversation } = require('../models');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
    }

    async initialize() {
        try {
            // Criar cliente do WhatsApp
            this.client = new Client({
                authStrategy: new LocalAuth(),
                puppeteer: {
                    args: ['--no-sandbox']
                }
            });

            // Evento quando o QR Code é recebido
            this.client.on('qr', (qr) => {
                console.log('QR Code recebido, escaneie-o com seu WhatsApp:');
                qrcode.generate(qr, { small: true });
            });

            // Evento quando o cliente está pronto
            this.client.on('ready', () => {
                console.log('Cliente WhatsApp está pronto!');
                this.isReady = true;
            });

            // Evento quando uma mensagem é recebida
            this.client.on('message', async (message) => {
                try {
                    console.log('Mensagem recebida:', message.body);
                    
                    // Buscar ou criar conversa
                    const phoneNumber = message.from;
                    let conversation = await Conversation.findOne({
                        where: {
                            phoneNumber,
                            status: 'active'
                        }
                    });

                    if (!conversation) {
                        // Criar nova conversa com o usuário admin
                        conversation = await Conversation.create({
                            userId: '5681a7b4-9b93-4332-91c5-dba9183241e8', // ID do usuário admin
                            phoneNumber,
                            status: 'active',
                            context: {},
                            metadata: {
                                lastMessageAt: new Date(),
                                messageCount: 1,
                                tags: []
                            }
                        });
                    }

                    // Salvar mensagem recebida
                    await Message.create({
                        conversationId: conversation.id,
                        content: message.body,
                        direction: 'incoming',
                        type: 'text',
                        status: 'received',
                        metadata: {
                            processed: false,
                            aiGenerated: false,
                            tokens: 0
                        }
                    });

                    // TODO: Processar mensagem com IA e enviar resposta
                    // Por enquanto, vamos apenas ecoar a mensagem
                    await this.sendMessage(phoneNumber, `Eco: ${message.body}`);

                } catch (error) {
                    console.error('Erro ao processar mensagem recebida:', error);
                }
            });

            // Inicializar cliente
            await this.client.initialize();
            console.log('Cliente WhatsApp inicializado!');

        } catch (error) {
            console.error('Erro ao inicializar cliente WhatsApp:', error);
            throw error;
        }
    }

    async sendMessage(to, content) {
        try {
            if (!this.isReady) {
                throw new Error('Cliente WhatsApp não está pronto');
            }

            // Enviar mensagem
            const response = await this.client.sendMessage(to, content);
            console.log('Mensagem enviada:', response);

            // Buscar conversa
            const conversation = await Conversation.findOne({
                where: {
                    phoneNumber: to,
                    status: 'active'
                }
            });

            if (conversation) {
                // Salvar mensagem enviada
                await Message.create({
                    conversationId: conversation.id,
                    content,
                    direction: 'outgoing',
                    type: 'text',
                    status: 'sent',
                    metadata: {
                        processed: true,
                        aiGenerated: true,
                        tokens: 0
                    }
                });
            }

            return response;
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    async getStatus() {
        return {
            isReady: this.isReady,
            info: this.client ? await this.client.info : null
        };
    }
}

// Exportar instância única do serviço
module.exports = new WhatsAppService(); 