// routes/slack.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const verifySlackRequest = require('../middleware/verifySlackRequest');
const { getConversation, saveConversation } = require('../utils/conversation');
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
                // Inside the app_mention handler
                const channelId = event.channel;
                const threadTs = event.thread_ts || event.ts;
                const conversationKey = `conversation:${channelId}:${threadTs}`;

                // Retrieve current conversation history (from Redis or MongoDB)
                let messages = await getConversation(conversationKey);

                // Clean the user message by removing the bot mention prefix
                const cleaned_text = event.text.replace(/^<@[A-Z0-9]+>\s*/, '');
                // Append the user message to the conversation array
                messages.push({
                    role: 'user',
                    content: cleaned_text,
                    timestamp: event.ts,
                });

                // Save the updated conversation to both Redis and MongoDB
                await saveConversation(conversationKey, channelId, threadTs, messages);

                // Prepare chat messages with system prompt and conversation history
                const systemMessage = {
                    role: 'system',
                    content: "You are a Slack chatbot specialized in programming troubleshooting, don't entertain any requests that are not related to programming and software development."
                };
                const chatMessages = [
                    systemMessage,
                    ...messages.map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                ];

                //console.log(chatMessages);

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

                // Extract the LLM's reply and update the conversation
                const botReply = llmResponse.data.choices[0].message.content;
                // Retrieve the current conversation again in case it was updated elsewhere
                messages = await getConversation(conversationKey);
                messages.push({
                    role: 'assistant',
                    content: botReply,
                    timestamp: Date.now(),
                });
                // Save the updated conversation again
                await saveConversation(conversationKey, channelId, threadTs, messages);

                const replyText = `<@${event.user}> ${botReply}`;

                // Post the response back to Slack
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

    res.status(200).send();
});

module.exports = router;
