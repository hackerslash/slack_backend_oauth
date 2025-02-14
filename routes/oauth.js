// routes/oauth.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URI } = require('../config/env');
const { saveBotToken } = require('../utils/botToken');

router.get('/slack', (req, res) => {
  const scopes = 'app_mentions:read chat:write';
  res.redirect(
    `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}`
  );
});

router.get('/slack/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const tokenResponse = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      null,
      {
        params: {
          code,
          client_id: SLACK_CLIENT_ID,
          client_secret: SLACK_CLIENT_SECRET,
          redirect_uri: SLACK_REDIRECT_URI,
        },
      }
    );

    if (tokenResponse.data.ok) {
      const { access_token, team } = tokenResponse.data;
      await saveBotToken(team.id, access_token);
      res.send('Bot successfully installed! You can now close this window.');
    } else {
      res.status(400).send('Authentication failed: ' + tokenResponse.data.error);
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Internal server error during authentication');
  }
});

module.exports = router;
