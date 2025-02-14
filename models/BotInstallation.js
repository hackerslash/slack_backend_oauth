// models/BotInstallation.js
const mongoose = require('mongoose');

const botInstallationSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  botToken: { type: String, required: true },
});

module.exports = mongoose.model('BotInstallation', botInstallationSchema);
