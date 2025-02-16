// models/BotInstallation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const botInstallationSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  botToken: { type: String, required: true },
  conversations: [conversationSchema],
});

module.exports = mongoose.model('BotInstallation', botInstallationSchema);