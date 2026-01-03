const sequelize = require('./database');
const models = require('../models');

async function syncDatabase(retries = 20, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Tentativa de conexão com o banco de dados (${i + 1}/${retries})...`);

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

      return; // Sucesso, sai da função

    } catch (error) {
      console.error(`❌ Falha na tentativa ${i + 1}:`, error.message);
      if (i < retries - 1) {
        console.log(`⏳ Aguardando ${delay / 1000} segundos antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ Todas as tentativas de conexão falharam.');
        process.exit(1);
      }
    }
  }
}

module.exports = syncDatabase; 