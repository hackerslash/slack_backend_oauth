// routes/slack.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const verifySlackRequest = require('../middleware/verifySlackRequest');
const { getConversation, addMessage } = require('../utils/conversation');
const { getBotToken } = require('../utils/botToken');
const { GROQ_API_KEY } = require('../config/env');

const router = express.Router();

// Use raw body parser middleware for Slack events
router.use(bodyParser.raw({ type: 'application/json' }));

router.post('/events', async (req, res) => {
  try {
    verifySlackRequest(req);
  } catch (error) {
    console.error('Verification failed:', error.message);
    return res.status(400).send();
  }

  const body = JSON.parse(req.body.toString());

  // URL verification challenge
  if (body.type === 'url_verification') {
    return res.status(200).json({ challenge: body.challenge });
  }

  // Process events
  if (body.type === 'event_callback') {
    const event = body.event;
    const teamId = body.team_id;

    try {
      const botToken = await getBotToken(teamId);
      if (!botToken) {
        console.error('No bot token found for team:', teamId);
        return res.status(401).send();
      }

      if (event.type === 'app_mention' && !event.bot_id) {
        const channelId = event.channel;
        const threadTs = event.thread_ts || event.ts;
        const conversationKey = `conversation:${channelId}:${threadTs}`;

        // Clean the user message (remove the bot mention prefix)
        const cleanedText = event.text.replace(/^<@[A-Z0-9]+>\s*/, '');

        // Add the user's message to the conversation in Redis and MongoDB
        await addMessage(conversationKey, channelId, threadTs, {
          role: 'user',
          content: cleanedText,
          timestamp: event.ts,
        });

        // Retrieve the updated conversation 
        const messages = await getConversation(conversationKey);

        // Prepare chat messages with a system prompt and the updated conversation history
        const systemMessage = {
          role: 'system',
          content: `You are a senior-level AI programming assistant specialized in software troubleshooting and system analysis. Your capabilities include:
        
                  1. Debugging code across programming languages
                  2. Analyzing stack traces, application logs, and metrics (APM, Prometheus, etc.)
                  3. Interpreting error messages and crash reports
                  4. Performance optimization strategies
                  5. Cloud infrastructure troubleshooting (AWS, GCP, Azure)
                  6. CI/CD pipeline issues
                  7. Containerization and orchestration problems (Docker, Kubernetes)
                  
                  Guidelines:
                  - Politely decline non-technical/non-programming requests with: "I specialize in technical troubleshooting. How can I help with your programming/system issue?"
                  - Ask clarifying questions about: runtime environment, error frequency, log snippets, relevant metrics, and code context
                  - Prioritize security best practices in responses
                  - Format complex responses with markdown snippets for code/commands/log analysis
                  - Reference official documentation when applicable
                  - Highlight potential anti-patterns in provided code/logs
                  
                  Response Style:
                  - Professional but approachable Slack tone
                  - Technical terms without jargon
                  - Bullet points for multiple items
                  - Avoid using full markdown syntax in the response. The responses should be mostly plaintext and only markdown syntax for *Bold* (Enclose any sentence in two single * ), _Italicize_, ~Strikethrough~, Code, > Block Quote, Code Block , Ordered List and * Bulleted List can be used whenever necessary.
                  - Step-by-step debugging workflows
                  - Use short concise response unless the question is complex or requires detailed explanation.`
        };
        const chatMessages = [
          systemMessage,
          ...messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ];

        // Request LLM response
        let llmResponse;
        try {
          llmResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: 'llama-3.1-8b-instant',
              messages: chatMessages,
            },
            {
              headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (err) {
          console.error('LLM API error:', err.response?.data || err);
          return res.status(500).send();
        }

        // Extract the LLM's reply and add it to the conversation
        const botReply = llmResponse.data.choices[0].message.content;
        await addMessage(conversationKey, channelId, threadTs, {
          role: 'assistant',
          content: botReply,
          timestamp: Date.now(),
        });

        const replyText = `<@${event.user}> ${botReply}`;

        // Post the assistant's reply back to Slack
        try {
          await axios.post(
            'https://slack.com/api/chat.postMessage',
            {
              channel: channelId,
              thread_ts: threadTs,
              text: replyText,
            },
            {
              headers: {
                Authorization: `Bearer ${botToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (err) {
          console.error('Slack API error:', err.response?.data || err);
        }
      }
    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).send();
    }
  }

  // respond with 200 after all processing is complete
  return res.status(200).send();
});

module.exports = router;
