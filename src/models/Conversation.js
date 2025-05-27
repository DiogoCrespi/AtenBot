const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'closed', 'pending'),
    defaultValue: 'active',
  },
  context: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {
      lastMessageAt: null,
      messageCount: 0,
      tags: [],
    },
  },
  isQualified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  qualificationData: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
});

module.exports = Conversation; 