// utils/botToken.js
const BotInstallation = require('../models/BotInstallation');
const { redisClient } = require('../config/db');

async function getBotToken(teamId) {
  // Try to get token from Redis first
  const cachedToken = await redisClient.get(`botToken:${teamId}`);
  if (cachedToken) {
    console.log("Token hit from Redis");
    return cachedToken;
  }

  // Fallback to MongoDB
  const installation = await BotInstallation.findOne({ teamId });
  if (installation) {
    await redisClient.setEx(`botToken:${teamId}`, 3600, installation.botToken);
    console.log("Token hit from MongoDB");
    return installation.botToken;
  }
  return null;
}

async function saveBotToken(teamId, botToken) {
  await Promise.all([
    BotInstallation.findOneAndUpdate(
      { teamId },
      { botToken },
      { upsert: true }
    ),
    redisClient.setEx(`botToken:${teamId}`, 3600, botToken),
  ]);
  console.log("Token synced to Mongo & Redis");
}

module.exports = {
  getBotToken,
  saveBotToken,
};
