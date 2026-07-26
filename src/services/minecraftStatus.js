const net = require('node:net');

const STATUS_API_BASE_URL = 'https://api.mcsrvstat.us/3';

function getMinecraftEndpoint() {
  const host = process.env.MINECRAFT_HOST;
  const configuredPort = process.env.MINECRAFT_PORT || '25565';

  if (!host) {
    return null;
  }

  if (host.includes(':') && !process.env.MINECRAFT_PORT) {
    const [address, port] = host.split(':');
    return {
      host: address,
      port,
      address: port === '25565' ? address : `${address}:${port}`,
    };
  }

  return {
    host,
    port: configuredPort,
    address: configuredPort === '25565' ? host : `${host}:${configuredPort}`,
  };
}

function checkTcpReachable(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({
      host,
      port: Number(port),
      timeout: 5000,
    });

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      resolve(false);
    });
  });
}

async function getServerStatus() {
  const endpoint = getMinecraftEndpoint();

  if (!endpoint) {
    return {
      configured: false,
      message: 'Minecraft status is not configured yet.',
    };
  }

  let response;

  try {
    response = await fetch(`${STATUS_API_BASE_URL}/${encodeURIComponent(endpoint.address)}`, {
      headers: {
        'User-Agent': 'The Commonwealth Discord Bot',
      },
      signal: AbortSignal.timeout(7000),
    });
  } catch (error) {
    return {
      configured: true,
      address: endpoint.address,
      online: false,
      reachable: await checkTcpReachable(endpoint.host, endpoint.port),
      version: 'Unknown',
      motd: null,
      players: {
        online: 0,
        max: 0,
        list: [],
      },
      statusError: error.message,
    };
  }

  if (!response.ok) {
    throw new Error(`Minecraft status request failed with ${response.status}`);
  }

  const data = await response.json();
  const playerList = Array.isArray(data.players?.list)
    ? data.players.list.map((player) => player.name || player).filter(Boolean)
    : [];

  return {
    configured: true,
    address: endpoint.address,
    online: Boolean(data.online),
    reachable: data.online ? true : await checkTcpReachable(endpoint.host, endpoint.port),
    version: data.version || 'Unknown',
    motd: Array.isArray(data.motd?.clean) ? data.motd.clean.join('\n') : null,
    players: {
      online: data.players?.online || 0,
      max: data.players?.max || 0,
      list: playerList,
    },
    statusError: null,
  };
}

module.exports = {
  getServerStatus,
};
