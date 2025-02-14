// config/env.js
require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
    SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI,
    MONGODB_URI: process.env.MONGODB_URI,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'development',
    REDIS_URL: process.env.REDIS_URL
};
