require('dotenv').config();
const express = require('express');
const cors = require('cors');
const syncDatabase = require('./config/syncDatabase');
const webhookController = require('./controllers/webhook.controller');
// Initialize Queue Workers
require('./services/queue/WorkerService');

// Log para verificar variáveis de ambiente
console.log('Variáveis de ambiente carregadas:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for potential media

// Rota de Webhook (Principal)
// Rota de Webhook (Principal)
app.use('/webhook', (req, res, next) => {
  if (req.method === 'POST') return webhookController.handleWebhook(req, res);
  next();
});
app.post('/webhook', (req, res) => webhookController.handleWebhook(req, res));

// Rotas de Autenticação (SaaS)
const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

// Rotas de Instância (SaaS)
const instanceRoutes = require('./routes/instance.routes');
app.use('/instance', instanceRoutes);

// Rotas de Configuração (SaaS)
const configRoutes = require('./routes/config.routes');
app.use('/config', configRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'AtenBot API (Evolution) is active!' });
});

// Inicialização
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Sincroniza o banco de dados
    await syncDatabase();

    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor AtenBot rodando na porta ${PORT}`);
      console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

startServer(); 