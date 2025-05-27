require('dotenv').config();
const express = require('express');
const cors = require('cors');
const syncDatabase = require('./config/syncDatabase');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'AtenBot API está funcionando!' });
});

// Inicialização
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Sincroniza o banco de dados
    await syncDatabase();

    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

startServer(); 