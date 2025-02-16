// middleware/verifySlackRequest.js
const crypto = require('crypto');
const { SLACK_SIGNING_SECRET } = require('../config/env');

// boiler 
function verifySlackRequest(req) {
  const slackSignature = req.headers['x-slack-signature'];
  const slackTimestamp = req.headers['x-slack-request-timestamp'];

  if (!slackSignature || !slackTimestamp) {
    throw new Error('Missing Slack signature or timestamp');
  }

  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
  if (Number(slackTimestamp) < fiveMinutesAgo) {
    throw new Error('Request timestamp is too old.');
  }

  const sigBasestring = `v0:${slackTimestamp}:${req.body.toString()}`;
  const mySignature = 'v0=' +
    crypto
      .createHmac('sha256', SLACK_SIGNING_SECRET)
      .update(sigBasestring, 'utf8')
      .digest('hex');

  const signatureBuffer = Buffer.from(mySignature, 'utf8');
  const slackSignatureBuffer = Buffer.from(slackSignature, 'utf8');
  if (!crypto.timingSafeEqual(signatureBuffer, slackSignatureBuffer)) {
    throw new Error('Signature verification failed');
  }
}

module.exports = verifySlackRequest;
