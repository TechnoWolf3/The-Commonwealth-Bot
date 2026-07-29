class ServerApiNotConfiguredError extends Error {
  constructor() {
    super('The Commonwealth server API is not configured yet.');
    this.name = 'ServerApiNotConfiguredError';
  }
}

class ServerApiRequestError extends Error {
  constructor(response, message) {
    super(message || `Server API request failed with ${response.status}`);
    this.name = 'ServerApiRequestError';
    this.status = response.status;
    this.statusText = response.statusText;
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
    let message = `Server API request failed with ${response.status}`;

    try {
      const payload = await response.json();
      message = payload.error || payload.message || message;
    } catch {
      // Keep the status-based message when the API does not return JSON.
    }

    throw new ServerApiRequestError(response, message);
  }

  if (response.status === 204) {
    return { ok: true };
  }

  const text = await response.text();

  if (!text) {
    return { ok: true };
  }

  return JSON.parse(text);
}

async function getServerApiHealth() {
  return requestJson('/health');
}

async function getBalanceForDiscordUser(discordUserId) {
  return requestJson(`/discord/users/${discordUserId}/balance`);
}

async function getDiscordRoleSync(discordUserId) {
  return requestJson(`/discord/users/${discordUserId}/role-sync`);
}

async function getDiscordLinkStatus(discordUserId) {
  return requestJson(`/discord/users/${discordUserId}/link`);
}

async function unlinkDiscordUser(discordUserId) {
  return requestJson(`/discord/users/${discordUserId}/link`, {
    method: 'DELETE',
  });
}

async function getNationProfile(nationName) {
  return requestJson(`/nations/${encodeURIComponent(nationName)}`);
}

async function getOnlinePlayers() {
  return requestJson('/players/online');
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

async function getWeeklyDigest(days = 7) {
  return requestJson(`/digest/weekly?days=${encodeURIComponent(days)}`);
}

module.exports = {
  ServerApiNotConfiguredError,
  ServerApiRequestError,
  getBalanceForDiscordUser,
  getDiscordLinkStatus,
  getDiscordRoleSync,
  getNationProfile,
  getOnlinePlayers,
  getPlayerProfile,
  getServerApiHealth,
  getWeeklyDigest,
  startAccountLink,
  unlinkDiscordUser,
};
