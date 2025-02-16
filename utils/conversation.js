// utils/conversation.js
const { redisClient } = require('../config/db');
const Conversation = require('../models/Conversation');

async function getConversation(key) {
    // Try to retrieve from Redis first
    //const data = await redisClient.get(key);
    const items = await redisClient.lRange(key, 0, -1);
    if (items) {
        return items.map(item => JSON.parse(item));
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
    await redisClient.rPush(key, JSON.stringify(truncatedMessages));
    await redisClient.expire(key, 60 * 30);

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
