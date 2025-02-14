// app.js
const express = require('express');
const session = require('express-session');
const { PORT, SESSION_SECRET, NODE_ENV } = require('./config/env');
const { connectDB, connectRedis } = require('./config/db');
const slackRoutes = require('./routes/slack');
const oauthRoutes = require('./routes/oauth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Setup sessions
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: NODE_ENV === 'production' },
  })
);

app.get('/ping', (req, res) => {

  res.json({ "Ping": "Pong" });

})

// Mount routes
app.use('/auth', oauthRoutes);
app.use('/slack', slackRoutes);

// Error handling middleware 
app.use(errorHandler);

// Start the server after database connections
async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
