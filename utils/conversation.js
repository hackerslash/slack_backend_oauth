// utils/conversation.js
const { redisClient } = require('../config/db');

async function getConversation(key) {
    // Retrieve messages in reverse chronological order and parse
    const data = await redisClient.lRange(key, 0, -1);
    return data.reverse().map(msg => JSON.parse(msg));
}

async function addMessageToConversation(key, message) {
    // Push new message to head of list and trim to last 5 messages
    await redisClient.lPush(key, JSON.stringify(message));
    await redisClient.lTrim(key, 0, 9); // Keep only first 5 conversation pairs
}

module.exports = {
    getConversation,
    saveConversation: addMessageToConversation, // Alias for clarity
};
