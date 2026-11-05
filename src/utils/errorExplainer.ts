/**
 * Error explanation and remediation hint utility
 * Translates low-level browser network errors, Telegram Bot API errors,
 * and WhatsApp Gateway errors into plain English explanations with actionable hints.
 */

export interface ExplainedError {
  title: string;
  technicalError: string;
  explanation: string;
  hint: string;
  actionKey?: 'open_config' | 'retry' | 'delete_webhook' | 'open_telegram_botfather' | 'test_whatsapp' | 'test_emigr8_ai';
  actionLabel?: string;
}

export function explainError(
  rawError: unknown,
  context: 'telegram_status' | 'telegram_sync' | 'telegram_webhook' | 'telegram_send' | 'whatsapp_send' | 'whatsapp_test' | 'emigr8_ai_test' | 'status_check' | 'general' = 'general'
): ExplainedError {
  let message = '';
  if (typeof rawError === 'string') {
    message = rawError;
  } else if (rawError && typeof rawError === 'object') {
    const obj = rawError as Record<string, unknown>;
    message = String(obj.message || obj.error || obj.description || obj.statusText || '');
    if (!message && 'toString' in rawError) {
      message = String(rawError);
    }
  }

  const lower = message.toLowerCase();

  // 1a. HTML Response / "Unexpected token '<', <html><hea... is not valid JSON"
  if (
    lower.includes('unexpected token') || 
    lower.includes('not valid json') || 
    lower.includes('<html>') || 
    lower.includes('<!doctype') || 
    lower.includes('received an html') || 
    lower.includes('received html') || 
    lower.includes('html webpage')
  ) {
    let specificCause = 'an endpoint returned an HTML webpage or error document instead of JSON data';
    let hintText = '1. Check "Configure Credentials" to ensure your URL is the exact JSON API route (e.g. /v1/chat or /api/send), not a website homepage.\n2. Ensure you did not paste a URL into the Telegram Bot Token field (tokens look like 123456:ABC...).\n3. If connecting to a local backend, verify the Express server is running on port 3000.';

    if (context === 'emigr8_ai_test') {
      specificCause = 'your eMigr8 AI Chat Endpoint URL returned an HTML web page instead of JSON';
      hintText = '1. Check the eMigr8 AI Chat Endpoint URL: ensure it includes the full API path (e.g. "https://api.emigr8.ai/v1/chat" or your server webhook) rather than the main website homepage ("https://emigr8.ai").\n2. Make sure the remote server accepts HTTP POST requests and returns JSON.\n3. Click "Configure Credentials" to update the chat endpoint URL.';
    } else if (context === 'telegram_status' || context === 'telegram_sync' || context === 'telegram_webhook' || context === 'telegram_send') {
      specificCause = 'Telegram Bot API or a web proxy returned an HTML page (usually caused by pasting a web URL or invalid format into the Bot Token field)';
      hintText = '1. Check your Telegram Bot Token in "Configure Credentials": It must be a token string from @BotFather (e.g. 123456789:ABCdef...), NOT a website URL or bot link (like https://t.me/yourbot).\n2. Remove any extra quotes, spaces, or "https://" prefixes from the Bot Token field.\n3. Click "Test Connection" again after updating.';
    } else if (context === 'whatsapp_test' || context === 'whatsapp_send') {
      specificCause = 'the WhatsApp Gateway URL returned an HTML page instead of a JSON API response';
      hintText = '1. Check your WhatsApp Gateway URL in "Configure Credentials": Ensure it points to the API endpoint (e.g. https://gateway.domain.com/api/send) rather than the homepage.\n2. Click "Test Connection" to verify the endpoint is reachable.';
    }

    return {
      title: 'Received HTML Webpage Instead of JSON (Unexpected Token \'<\')',
      technicalError: message || 'SyntaxError: Unexpected token \'<\', "<html><hea"... is not valid JSON',
      explanation: `The application attempted to parse a server response as JSON, but received an HTML document instead (${specificCause}). This happens when an endpoint URL points to a website frontpage, documentation portal, or an HTML error page (404/502) rather than an active REST API / Webhook.`,
      hint: hintText,
      actionKey: 'open_config',
      actionLabel: 'Configure Credentials'
    };
  }

  // 1. Browser "Failed to fetch" / Network Unreachable Error
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('connection refused') || lower.includes('econnrefused')) {
    let endpointDesc = 'the backend server';
    if (context === 'telegram_status') endpointDesc = 'the Telegram Bot API status endpoint (/api/telegram/status)';
    if (context === 'telegram_sync') endpointDesc = 'the Telegram sync endpoint (/api/telegram/sync)';
    if (context === 'telegram_webhook') endpointDesc = 'the Telegram webhook setup endpoint (/api/telegram/set-webhook)';
    if (context === 'whatsapp_send' || context === 'whatsapp_test') endpointDesc = 'the WhatsApp gateway service';
    if (context === 'status_check') endpointDesc = 'the Admin Dashboard status proxy (/api/status)';

    return {
      title: 'Backend Connection Unreachable (Failed to fetch)',
      technicalError: message || 'TypeError: Failed to fetch',
      explanation: `The browser could not establish an HTTP network connection to ${endpointDesc}. This happens when the local dev server is restarting, changing ports, or network communication between the frontend preview and the Express backend (port 3000) was momentarily disrupted.`,
      hint: '1. Wait 2-3 seconds for the server to finish starting.\n2. Click "Retry Connection" below.\n3. If running in AI Studio preview, check that the dev server is active on port 3000.',
      actionKey: 'retry',
      actionLabel: 'Retry Connection'
    };
  }

  // 2. Telegram Bot Token Missing / Unconfigured
  if (lower.includes('not configured') || lower.includes('my_telegram_bot_token') || lower.includes('token not set') || lower.includes('token is required')) {
    return {
      title: 'Telegram Bot Token Not Configured',
      technicalError: message,
      explanation: 'No valid Telegram Bot Token was detected in the environment. The app cannot ping Telegram without your bot secret from @BotFather.',
      hint: 'Click "Configure Credentials" below to paste your Bot Token (e.g. 123456789:ABCdef...), or set TELEGRAM_BOT_TOKEN in your .env / Secrets.',
      actionKey: 'open_config',
      actionLabel: 'Configure Credentials'
    };
  }

  // 3. Telegram 401 Unauthorized / Invalid Token
  if (lower.includes('unauthorized') || lower.includes('invalid token') || lower.includes('bot token is invalid') || lower.includes('401')) {
    return {
      title: 'Telegram Bot Token Rejected (401 Unauthorized)',
      technicalError: message,
      explanation: 'Telegram Bot API rejected the token. The token string is either misspelled, has extra spaces/quotes, belongs to a deleted bot, or was revoked in @BotFather.',
      hint: 'Open @BotFather on Telegram, send "/mybots", select your bot, click "API Token", and copy the exact full token string into the configuration box.',
      actionKey: 'open_config',
      actionLabel: 'Update Bot Token'
    };
  }

  // 4. Telegram 409 Conflict: Webhook Active vs getUpdates Polling
  if (lower.includes('conflict') || lower.includes('webhook is active') || lower.includes('can\'t use getupdates')) {
    return {
      title: 'Telegram Sync Blocked by Active Webhook (409 Conflict)',
      technicalError: message,
      explanation: 'Telegram does not allow polling messages (via getUpdates) while a webhook URL is actively registered. When a webhook is active, Telegram pushes messages to your webhook URL instead of keeping them in the polling queue.',
      hint: 'You have two options:\n• Option A: Click "Clear / Reset Webhook" below to allow message sync via polling.\n• Option B: Leave the webhook active and let applicants chat; their messages will arrive via the Inbound Webhook URL.',
      actionKey: 'delete_webhook',
      actionLabel: 'Clear / Reset Webhook'
    };
  }

  // 5. Telegram 400 Bad Request: Chat not found or phone number passed
  if (lower.includes('chat not found') || lower.includes('chat_id is empty') || lower.includes('is a phone number') || lower.includes('bots cannot message phone numbers')) {
    return {
      title: 'Telegram Recipient Not Found (Requires Telegram Chat ID)',
      technicalError: message,
      explanation: 'Telegram bots cannot send messages to phone numbers or initiate conversations with private users. Telegram privacy rules require the applicant to click "START" on your bot first (@SiseDevBot).',
      hint: '1. Open @SiseDevBot on Telegram (https://t.me/SiseDevBot) and click "START".\n2. Send any message like "Hello".\n3. Your chat will immediately appear in the Admin Console, allowing you to reply directly!',
      actionKey: 'open_telegram_botfather',
      actionLabel: 'Open @SiseDevBot'
    };
  }

  // 5b. WAWCD Outbound send-message used as inbox feed
  if (lower.includes('cannot get /webhooks/send-message') || (lower.includes('send-message') && lower.includes('outbound'))) {
    return {
      title: 'WAWCD URL is for Outbound Sending (Not an Inbox Feed)',
      technicalError: message,
      explanation: 'The URL "https://backend.wawcd.com/webhooks/send-message" is WAWCD\'s Outbound API to deliver WhatsApp messages to recipients, not a readable message inbox. It cannot be polled via GET.',
      hint: 'This URL is already automatically configured to send WhatsApp messages from this dashboard! To receive messages, provide your webhook URL to WAWCD or your developer.',
      actionKey: 'open_config',
      actionLabel: 'View Configuration'
    };
  }

  // 6. WhatsApp Gateway URL Missing
  if (lower.includes('whatsapp_gateway_url') || (lower.includes('gateway') && lower.includes('missing'))) {
    return {
      title: 'WhatsApp Gateway URL Missing',
      technicalError: message,
      explanation: 'The Admin Dashboard does not know where to send WhatsApp messages because your developer\'s WhatsApp Gateway URL is not configured.',
      hint: 'Click "Configure WhatsApp" below and enter the URL (e.g. https://api.yourdeveloper.com/send) provided by your WhatsApp developer.',
      actionKey: 'open_config',
      actionLabel: 'Configure WhatsApp'
    };
  }

  // 7. WhatsApp 401 Unauthorized / 403 Forbidden
  if ((context === 'whatsapp_send' || context === 'whatsapp_test') && (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('forbidden'))) {
    return {
      title: 'WhatsApp Gateway Authentication Failed (401 / 403)',
      technicalError: message,
      explanation: 'Your developer\'s WhatsApp gateway server rejected the request (401 Unauthorized or 403 Forbidden).',
      hint: '1. Ask your WhatsApp developer if the endpoint requires specific headers or authorization.\n2. Open "Configure WhatsApp" and verify the Gateway URL.\n3. Click "Test Connection" to verify access.',
      actionKey: 'open_config',
      actionLabel: 'Configure WhatsApp'
    };
  }

  // 8. WhatsApp 404 Not Found
  if ((context === 'whatsapp_send' || context === 'whatsapp_test') && (lower.includes('404') || lower.includes('not found'))) {
    return {
      title: 'WhatsApp Gateway Endpoint Not Found (404)',
      technicalError: message,
      explanation: 'The WhatsApp Gateway URL returned a 404 Not Found status. The domain or endpoint path (e.g., /api/send or /v1/messages) does not match your developer\'s API route.',
      hint: 'Check the exact URL path provided by your developer. Make sure it includes the full path (e.g., https://service.domain.com/api/v1/messages instead of just https://service.domain.com).',
      actionKey: 'open_config',
      actionLabel: 'Fix Gateway URL'
    };
  }

  // 9. WhatsApp 500 / 502 / 503 Server Error
  if ((context === 'whatsapp_send' || context === 'whatsapp_test') && (lower.includes('500') || lower.includes('502') || lower.includes('503') || lower.includes('bad gateway'))) {
    return {
      title: 'Developer WhatsApp Gateway Server Error (5xx)',
      technicalError: message,
      explanation: 'Your developer\'s WhatsApp backend server encountered an internal server error while processing the request.',
      hint: 'Contact your WhatsApp developer and share the timestamp and recipient phone number. They can check their server application logs to see why the request crashed.',
      actionKey: 'test_whatsapp',
      actionLabel: 'Test Gateway'
    };
  }

  // 10. Rate limiting / 429 Too Many Requests
  if (lower.includes('429') || lower.includes('too many requests') || lower.includes('rate limit')) {
    return {
      title: 'Rate Limit Reached (429 Too Many Requests)',
      technicalError: message,
      explanation: 'Too many requests were sent in a short period. The messaging provider has temporarily throttled outgoing messages.',
      hint: 'Wait 30-60 seconds before retrying or sending another interjection.',
      actionKey: 'retry',
      actionLabel: 'Retry Now'
    };
  }

  // 11. Generic fallback with context awareness
  return {
    title: 'Operation Encountered an Error',
    technicalError: message || 'Unknown error occurred',
    explanation: `The application received an unexpected response while processing ${context.replace(/_/g, ' ')}. The underlying service returned: "${message || 'Unknown failure'}"`,
    hint: '1. Check the technical error details below.\n2. Review your channel configuration in the Channel Integrations tab.\n3. Try refreshing the page or retrying the operation.',
    actionKey: 'open_config',
    actionLabel: 'Review Settings'
  };
}
