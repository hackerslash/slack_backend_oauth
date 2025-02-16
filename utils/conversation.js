// utils/conversation.js
const { redisClient } = require('../config/db');
const Conversation = require('../models/Conversation');

async function getConversation(key) {
    // Try to retrieve from Redis first
    const data = await redisClient.get(key);
    if (data) {
        return JSON.parse(data);
    }
    // Fallback: if not in Redis, try MongoDB
    const conversation = await Conversation.findOne({ conversationKey: key });
    if (conversation) {
        return conversation.messages;
    }
    return [];
}

async function saveConversation(key, channelId, threadTs, messages) {
    // Save the last 5 messages to Redis
    const truncatedMessages = messages.slice(-5);
    await redisClient.set(key, JSON.stringify(truncatedMessages));

    // Upsert the conversation in MongoDB
    await Conversation.findOneAndUpdate(
        { conversationKey: key },
        {
            conversationKey: key,
            channelId,
            threadTs,
            messages: truncatedMessages,
        },
        { upsert: true, new: true }
    );
}

module.exports = {
    getConversation,
    saveConversation,
};
