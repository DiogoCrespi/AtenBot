const express = require('express');
const router = express.Router();
const { Conversation, Message, User } = require('../models');
const { Op } = require('sequelize');

// Listar todas as conversas
router.get('/', async (req, res) => {
    try {
        const conversations = await Conversation.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Message,
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                    attributes: ['content', 'direction', 'createdAt']
                }
            ],
            order: [['updatedAt', 'DESC']]
        });
        res.json(conversations);
    } catch (error) {
        console.error('Erro ao listar conversas:', error);
        res.status(500).json({ error: 'Erro ao listar conversas' });
    }
});

// Buscar conversa por ID
router.get('/:id', async (req, res) => {
    try {
        const conversation = await Conversation.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Message,
                    order: [['createdAt', 'ASC']]
                }
            ]
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Erro ao buscar conversa:', error);
        res.status(500).json({ error: 'Erro ao buscar conversa' });
    }
});

// Criar nova conversa
router.post('/', async (req, res) => {
    try {
        const { userId, phoneNumber, context, metadata } = req.body;

        // Verificar se já existe uma conversa ativa com este número
        const existingConversation = await Conversation.findOne({
            where: {
                phoneNumber,
                status: 'active'
            }
        });

        if (existingConversation) {
            return res.status(400).json({ 
                error: 'Já existe uma conversa ativa com este número',
                conversationId: existingConversation.id
            });
        }

        const conversation = await Conversation.create({
            userId,
            phoneNumber,
            context: context || {},
            metadata: metadata || {
                lastMessageAt: null,
                messageCount: 0,
                tags: []
            }
        });

        res.status(201).json(conversation);
    } catch (error) {
        console.error('Erro ao criar conversa:', error);
        res.status(500).json({ error: 'Erro ao criar conversa' });
    }
});

// Atualizar conversa
router.put('/:id', async (req, res) => {
    try {
        const { status, context, metadata, isQualified, qualificationData } = req.body;
        const conversation = await Conversation.findByPk(req.params.id);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }

        // Atualizar apenas os campos fornecidos
        if (status) conversation.status = status;
        if (context) conversation.context = context;
        if (metadata) conversation.metadata = metadata;
        if (isQualified !== undefined) conversation.isQualified = isQualified;
        if (qualificationData) conversation.qualificationData = qualificationData;

        await conversation.save();
        res.json(conversation);
    } catch (error) {
        console.error('Erro ao atualizar conversa:', error);
        res.status(500).json({ error: 'Erro ao atualizar conversa' });
    }
});

// Deletar conversa
router.delete('/:id', async (req, res) => {
    try {
        const conversation = await Conversation.findByPk(req.params.id);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }

        await conversation.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar conversa:', error);
        res.status(500).json({ error: 'Erro ao deletar conversa' });
    }
});

// Buscar conversas por número de telefone
router.get('/phone/:phoneNumber', async (req, res) => {
    try {
        const conversations = await Conversation.findAll({
            where: {
                phoneNumber: req.params.phoneNumber
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Message,
                    order: [['createdAt', 'DESC']],
                    limit: 10
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        res.json(conversations);
    } catch (error) {
        console.error('Erro ao buscar conversas por telefone:', error);
        res.status(500).json({ error: 'Erro ao buscar conversas por telefone' });
    }
});

// Buscar conversas por status
router.get('/status/:status', async (req, res) => {
    try {
        const conversations = await Conversation.findAll({
            where: {
                status: req.params.status
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Message,
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                    attributes: ['content', 'direction', 'createdAt']
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        res.json(conversations);
    } catch (error) {
        console.error('Erro ao buscar conversas por status:', error);
        res.status(500).json({ error: 'Erro ao buscar conversas por status' });
    }
});

module.exports = router; 