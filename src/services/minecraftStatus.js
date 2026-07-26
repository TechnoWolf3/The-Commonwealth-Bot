const STATUS_API_BASE_URL = 'https://api.mcsrvstat.us/3';

function getMinecraftAddress() {
  const host = process.env.MINECRAFT_HOST;
  const port = process.env.MINECRAFT_PORT || '25565';

  if (!host) {
    return null;
  }

  return port === '25565' ? host : `${host}:${port}`;
}

async function getServerStatus() {
  const address = getMinecraftAddress();

  if (!address) {
    return {
      configured: false,
      message: 'Minecraft status is not configured yet.',
    };
  }

  const response = await fetch(`${STATUS_API_BASE_URL}/${encodeURIComponent(address)}`, {
    signal: AbortSignal.timeout(7000),
  });

  if (!response.ok) {
    throw new Error(`Minecraft status request failed with ${response.status}`);
  }

  const data = await response.json();
  const playerList = Array.isArray(data.players?.list)
    ? data.players.list.map((player) => player.name || player).filter(Boolean)
    : [];

  return {
    configured: true,
    address,
    online: Boolean(data.online),
    version: data.version || 'Unknown',
    motd: Array.isArray(data.motd?.clean) ? data.motd.clean.join('\n') : null,
    players: {
      online: data.players?.online || 0,
      max: data.players?.max || 0,
      list: playerList,
    },
  };
}

module.exports = {
  getServerStatus,
};
