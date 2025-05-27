const sequelize = require('./database');
const models = require('../models');

async function syncDatabase() {
  try {
    // Sincroniza as tabelas na ordem correta
    await models.User.sync({ alter: true });
    await models.Conversation.sync({ alter: true });
    await models.Message.sync({ alter: true });
    
    console.log('✅ Banco de dados sincronizado com sucesso!');

    // Cria um usuário admin padrão se não existir
    const { User } = models;
    const adminExists = await User.findOne({ where: { email: 'admin@atenbot.com' } });

    if (!adminExists) {
      await User.create({
        name: 'Administrador',
        email: 'admin@atenbot.com',
        password: 'AtenBot@2024!', 
        role: 'admin',
        apiKey: 'admin-' + Date.now(),
        settings: {
          botTone: 'professional',
          autoReply: true,
          maxTokens: 1000,
        },
      });
      console.log('👤 Usuário admin criado com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro ao sincronizar banco de dados:', error);
    process.exit(1);
  }
}

module.exports = syncDatabase; 