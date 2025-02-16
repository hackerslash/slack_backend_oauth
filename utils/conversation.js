const { redisClient } = require('../config/db');
const BotInstallation = require('../models/BotInstallation');

async function getConversation(teamId) {
    const cachedConversation = await redisClient.lRange(`conversation:${teamId}`, 0, -1);
    if (cachedConversation.length > 0) {
        console.log("Conversation hit from Redis");
        return cachedConversation.reverse().map(msg => JSON.parse(msg));
    }

    const installation = await BotInstallation.findOne({ teamId });
    if (installation && installation.conversations) {
        const conversation = installation.conversations.map(({ message, timestamp }) => ({ message, timestamp }));
        await redisClient.rPush(`conversation:${teamId}`, ...conversation.map(conversation => JSON.stringify(conversation)));
        await redisClient.expire(`conversation:${teamId}`, 3600);
        return conversation;
    }
    return [];
}
async function addMessageToConversation(teamId, message) {
    await Promise.all([
        BotInstallation.findOneAndUpdate(
            { teamId },
            { $push: { conversations: { message, timestamp: new Date() } } },
            { upsert: true }
        ),
        redisClient.lPush(`conversation:${teamId}`, JSON.stringify({ message, timestamp: new Date() })),
        redisClient.lTrim(`conversation:${teamId}`, 0, 99),
        redisClient.expire(`conversation:${teamId}`, 3600),
    ]);
}

module.exports = {
    getConversation,
    saveConversation: addMessageToConversation
};