const http = require('node:http');
const { sendMinecraftMessageToDiscord } = require('./chatBridge');

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;

      if (body.length > 16384) {
        request.destroy();
        reject(new Error('Request body too large.'));
      }
    });

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(payload));
}

function hasValidBridgeAuth(request) {
  const apiKey = process.env.MINECRAFT_BRIDGE_API_KEY;
  const authorization = request.headers.authorization;
  const headerKey = request.headers['x-bridge-api-key'];

  if (!apiKey) {
    return false;
  }

  return authorization === `Bearer ${apiKey}` || headerKey === apiKey;
}

function createMinecraftBridgeServer(client) {
  return http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method !== 'POST' || request.url !== '/bridge/minecraft/chat') {
      sendJson(response, 404, { error: 'Not found.' });
      return;
    }

    if (!hasValidBridgeAuth(request)) {
      sendJson(response, 401, { error: 'Unauthorized.' });
      return;
    }

    try {
      const payload = await readJsonBody(request);
      await sendMinecraftMessageToDiscord(client, payload);
      sendJson(response, 202, { ok: true });
    } catch (error) {
      console.error('Failed to process Minecraft chat bridge event:', error);
      sendJson(response, 500, { error: 'Failed to process Minecraft chat event.' });
    }
  });
}

function startMinecraftBridgeServer(client) {
  const port = process.env.PORT || process.env.BRIDGE_HTTP_PORT;

  if (!port || !process.env.DISCORD_CHAT_CHANNEL_ID || !process.env.MINECRAFT_BRIDGE_API_KEY) {
    console.log('Minecraft chat bridge HTTP endpoint is not enabled.');
    return null;
  }

  const server = createMinecraftBridgeServer(client);

  server.listen(Number(port), () => {
    console.log(`Minecraft chat bridge HTTP endpoint listening on port ${port}.`);
  });

  server.on('error', (error) => {
    console.error('Minecraft chat bridge HTTP endpoint failed:', error);
  });

  return server;
}

module.exports = {
  createMinecraftBridgeServer,
  startMinecraftBridgeServer,
};
