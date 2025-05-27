const User = require('./User');
const Conversation = require('./Conversation');
const Message = require('./Message');

// Relações
User.hasMany(Conversation, { foreignKey: 'userId' });
Conversation.belongsTo(User, { foreignKey: 'userId' });

Conversation.hasMany(Message, { foreignKey: 'conversationId' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

module.exports = {
  User,
  Conversation,
  Message,
}; 