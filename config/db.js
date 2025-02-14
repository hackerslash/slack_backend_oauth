// config/db.js
const mongoose = require('mongoose');
const { createClient } = require('redis');
const { MONGODB_URI, REDIS_URL } = require('./env');

const redisClient = createClient({ url: REDIS_URL });

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {});
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Redis connection error:', err);
    throw err;
  }
}

module.exports = {
  connectDB,
  connectRedis,
  redisClient,
};
