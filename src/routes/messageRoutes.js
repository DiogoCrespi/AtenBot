const express = require('express');
const router = express.Router();
const { Message, Conversation, User } = require('../models');

// Listar todas as mensagens
router.get('/', async (req, res) => {
  try {
    const messages = await Message.findAll({
      include: [
        {
          model: Conversation,
          attributes: ['id', 'phoneNumber', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(messages);
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    res.status(500).json({ error: 'Erro ao listar mensagens' });
  }
});

// Buscar mensagem por ID
router.get('/:id', async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id, {
      include: [
        {
          model: Conversation,
          attributes: ['id', 'phoneNumber', 'status']
        }
      ]
    });
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    res.json(message);
  } catch (error) {
    console.error('Erro ao buscar mensagem:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagem' });
  }
});

// Listar mensagens de uma conversa
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { conversationId: req.params.conversationId },
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (error) {
    console.error('Erro ao listar mensagens da conversa:', error);
    res.status(500).json({ error: 'Erro ao listar mensagens da conversa' });
  }
});

// Criar nova mensagem
router.post('/', async (req, res) => {
  try {
    const { conversationId, content, direction, type, metadata, status, error: errorField } = req.body;
    const message = await Message.create({
      conversationId,
      content,
      direction,
      type,
      metadata,
      status,
      error: errorField
    });
    res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    res.status(500).json({ error: 'Erro ao criar mensagem' });
  }
});

// Atualizar mensagem
router.put('/:id', async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    const { content, metadata, status, error: errorField } = req.body;
    if (content) message.content = content;
    if (metadata) message.metadata = metadata;
    if (status) message.status = status;
    if (errorField) message.error = errorField;
    await message.save();
    res.json(message);
  } catch (error) {
    console.error('Erro ao atualizar mensagem:', error);
    res.status(500).json({ error: 'Erro ao atualizar mensagem' });
  }
});

// Deletar mensagem
router.delete('/:id', async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    await message.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar mensagem:', error);
    res.status(500).json({ error: 'Erro ao deletar mensagem' });
  }
});

module.exports = router; 