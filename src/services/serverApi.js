class ServerApiNotConfiguredError extends Error {
  constructor() {
    super('The Commonwealth server API is not configured yet.');
    this.name = 'ServerApiNotConfiguredError';
  }
}

function getApiBaseUrl() {
  return process.env.SERVER_API_BASE_URL;
}

async function requestJson(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new ServerApiNotConfiguredError();
  }

  const url = new URL(endpoint, baseUrl);
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (process.env.SERVER_API_KEY) {
    headers.Authorization = `Bearer ${process.env.SERVER_API_KEY}`;
  }

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(7000),
  });

  if (!response.ok) {
    throw new Error(`Server API request failed with ${response.status}`);
  }

  return response.json();
}

async function getBalanceForDiscordUser(discordUserId) {
  return requestJson(`/discord/users/${discordUserId}/balance`);
}

async function startAccountLink(discordUserId, minecraftUsername) {
  return requestJson('/discord/links', {
    method: 'POST',
    body: {
      discordUserId,
      minecraftUsername,
    },
  });
}

async function getPlayerProfile(minecraftUsername) {
  return requestJson(`/players/${encodeURIComponent(minecraftUsername)}`);
}

module.exports = {
  ServerApiNotConfiguredError,
  getBalanceForDiscordUser,
  getPlayerProfile,
  startAccountLink,
};
