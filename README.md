# AI Slack Chatbot

A modular oauth 2.0 compliant Slack bot built with Node.js, Express, integrated with an LLM (via Groq) for programming troubleshooting, and leveraging MongoDB and Redis for persistent token and chat cache storage.

Made as per the requirement of recruitment assignment of Doctor Droid. A YC backed startup focussing on automated investigation of telemetry data using AI.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Slack App Manifest](#slack-app-manifest)
- [Usage](#usage)

## Overview

This Slack app handles Slack OAuth installation, processes events (like `app_mention`), and utilizes a Large Language Model (LLM) to answer programming-related queries. It is structured in a modular way separating configuration, middleware, models, routes, and utility functions.

## Features

- **Slack OAuth Installation:** Supports installing the bot into Slack workspaces.
- **Event Handling:** Listens to Slack events (e.g., app mentions) and responds accordingly.
- **LLM Integration:** Leverages an LLM (via Groq) to generate responses for programming troubleshooting.
- **Database Integration:** Uses MongoDB for persistent access token storage and Redis for caching tokens and conversation history.
- **Modular Architecture:** Codebase organized into configuration, middleware, models, routes, and utilities.
- **Centralized Error Handling:** Includes error-handling middleware for improved debugging and maintenance.

## Project Structure

```
slack-backend-oauth/
├── config/
│   ├── env.js            # Loads environment variables.
│   └── db.js             # Connects to MongoDB and Redis.
├── middleware/
│   ├── verifySlackRequest.js   # Verifies Slack requests.
│   └── errorHandler.js           # Centralized error handling.
├── models/
│   └── BotInstallation.js  # Mongoose model for Slack bot 
│   └── Conversation.js  # Mongoose model for Slack bot
│   conversations.
├── routes/
│   ├── oauth.js            # OAuth endpoints for Slack installation.
│   └── slack.js            # Handles Slack events.
├── utils/
│   ├── conversation.js     # Manages conversation history in Redis.
│   └── botToken.js         # Manages bot tokens with MongoDB and Redis.
├── manifest.json           # Slack App Manifest.
├── app.js                  # Main application entry point.
├── package.json            # Project dependencies and scripts.
└── .env                    # Environment variables.
```

## Prerequisites

- **Node.js** (v14 or later)
- **MongoDB** instance (local or cloud)
- **Redis** server (local or cloud)
- A Slack account to create a Slack app with appropriate scopes

## Installation

### Option 1:

<a href="https://slack.com/oauth/v2/authorize?client_id=8445300914516.8453525842965&scope=app_mentions:read,chat:write&user_scope="><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>

### Option 2:



1. **Clone the repository:**

   ```bash
   git clone https://github.com/hackerslash/slack_backend_oauth.git
   cd slack_backend_oauth
   ```
2. **Install dependencies:**

   ```bash
   npm install
   ```

## Configuration

**Create a `.env` file in the root directory** with the following variables:

   ```dotenv
   PORT=3000
   SLACK_SIGNING_SECRET=your_slack_signing_secret
   SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_SECRET=your_slack_client_secret
   SLACK_REDIRECT_URI=https://your-domain.com/auth/slack/callback
   GROQ_API_KEY=your_groq_api_key
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   NODE_ENV=development
   REDIS_URL=your redis url
   ```

Obtain Slack details from the Slack API website by creating an App.

## Running the App

After setting up your environment variables and installing dependencies, start the server:

```bash
node app.js
```

This will:

- Connect to MongoDB and Redis.
- Start an Express server on the specified port (default: 3000).
- Listen for Slack OAuth and event requests.

## Slack App Manifest

The provided `manifest.json` file defines your Slack app's settings. Ensure you update URLs and scopes as needed:

## Usage

- **OAuth Installation:** Visit `/auth/slack` to initiate the Slack OAuth flow.
- **Handling Events:** Once installed, the bot listens to Slack events (e.g., `app_mention`) and processes them through the `/slack/events` endpoint.
- **LLM Integration:** When the bot is mentioned, it retrieves the conversation history, prepares a prompt with a system message, and sends it to the LLM API. The response is then posted back to Slack.
- **Slack Workspace:** Access the app from slack workspace. It can be invoked by mentioning it with an `@`.


