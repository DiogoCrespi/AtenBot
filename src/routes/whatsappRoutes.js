const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');

// Inicializar conexão com WhatsApp
router.post('/initialize', async (req, res) => {
    try {
        await whatsappService.initialize();
        res.json({ message: 'Cliente WhatsApp inicializado com sucesso!' });
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao inicializar WhatsApp' });
    }
});

// Verificar status da conexão
router.get('/status', async (req, res) => {
    try {
        const status = await whatsappService.getStatus();
        res.json(status);
    } catch (error) {
        console.error('Erro ao verificar status do WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao verificar status do WhatsApp' });
    }
});

// Enviar mensagem
router.post('/send', async (req, res) => {
    try {
        const { to, content } = req.body;
        
        if (!to || !content) {
            return res.status(400).json({ error: 'Número de telefone e conteúdo são obrigatórios' });
        }

        const response = await whatsappService.sendMessage(to, content);
        res.json({ message: 'Mensagem enviada com sucesso!', response });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

module.exports = router; 