const sequelize = require('./database');
const models = require('../models');
const bcrypt = require('bcryptjs');

async function syncDatabase(retries = 20, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Tentativa de conexão com o banco de dados (${i + 1}/${retries})...`);

      // Sincroniza as tabelas na ordem correta
      await models.User.sync({ alter: true });
      await models.Conversation.sync({ alter: true });
      await models.Message.sync({ alter: true });

      console.log('✅ Banco de dados sincronizado com sucesso!');

      // Cria ou atualiza usuário admin padrão
      const { User } = models;
      const adminEmail = 'admin@atenbot.com';
      const adminPassword = await bcrypt.hash('AtenBot@2024!', 10);

      const adminExists = await User.findOne({ where: { email: adminEmail } });

      if (!adminExists) {
        await User.create({
          name: 'Administrador',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          apiKey: 'admin-' + Date.now(),
          settings: {
            botTone: 'professional',
            autoReply: true,
            maxTokens: 1000,
          },
        });
        console.log('👤 Usuário admin criado com sucesso!');
      } else {
        // Force update password for development/recovery
        adminExists.password = adminPassword;
        await adminExists.save();
        console.log('👤 Senha do Admin atualizada com sucesso!');
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