function getBridgeConfig() {
  return {
    discordChannelId: process.env.DISCORD_CHAT_CHANNEL_ID,
    minecraftApiUrl: process.env.MINECRAFT_BRIDGE_API_URL,
    apiKey: process.env.MINECRAFT_BRIDGE_API_KEY,
  };
}

function isDiscordToMinecraftConfigured() {
  const config = getBridgeConfig();
  return Boolean(config.discordChannelId && config.minecraftApiUrl && config.apiKey);
}

function isMinecraftToDiscordConfigured() {
  const config = getBridgeConfig();
  return Boolean(config.discordChannelId && config.apiKey);
}

function cleanMinecraftMessage(value, fallback = 'Unknown') {
  return String(value || fallback)
    .replace(/[\r\n]+/g, ' ')
    .replace(/@/g, '@\u200b')
    .trim()
    .slice(0, 1800);
}

async function forwardDiscordMessageToMinecraft(message) {
  const config = getBridgeConfig();

  if (!isDiscordToMinecraftConfigured()) {
    return;
  }

  const payload = {
    discordUserId: message.author.id,
    discordUsername: message.author.username,
    displayName: message.member?.displayName || message.author.username,
    content: message.content,
    attachments: message.attachments.map((attachment) => attachment.url),
  };

  const response = await fetch(new URL('/discord/chat', config.minecraftApiUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(7000),
  });

  if (!response.ok) {
    throw new Error(`Minecraft bridge rejected Discord chat with ${response.status}`);
  }
}

async function sendMinecraftMessageToDiscord(client, payload) {
  const config = getBridgeConfig();

  if (!isMinecraftToDiscordConfigured()) {
    throw new Error('Minecraft to Discord chat bridge is not configured.');
  }

  const channel = await client.channels.fetch(config.discordChannelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error('Configured Discord chat channel is not text-based or could not be found.');
  }

  const username = cleanMinecraftMessage(payload.username || payload.playerName, 'Minecraft');
  const content = cleanMinecraftMessage(payload.content || payload.message, '');

  if (!content) {
    return;
  }

  await channel.send({
    content: `**${username}**: ${content}`,
    allowedMentions: {
      parse: [],
    },
  });
}

module.exports = {
  cleanMinecraftMessage,
  forwardDiscordMessageToMinecraft,
  isDiscordToMinecraftConfigured,
  isMinecraftToDiscordConfigured,
  sendMinecraftMessageToDiscord,
};
