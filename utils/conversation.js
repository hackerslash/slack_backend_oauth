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

async function addMessage(key, channelId, threadTs, message) {
    // Push the new message to Redis
    await redisClient.rPush(key, JSON.stringify(message));

    // Trim the list to only the last 5 messages
    await redisClient.lTrim(key, -5, -1);

    // Set the key to expire after 60 minutes (3600 seconds)
    await redisClient.expire(key, 3600);

    // Update MongoDB: push the new message into the messages array.
    await Conversation.findOneAndUpdate(
        { conversationKey: key },
        {
            $push: { messages: message },
            $set: { channelId, threadTs }
        },
        { upsert: true, new: true }
    );
}

module.exports = {
    getConversation,
    addMessage,
};
