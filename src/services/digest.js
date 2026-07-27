const { EmbedBuilder } = require('discord.js');
const { formatList, formatNumber, truncate } = require('./formatters');
const { ServerApiNotConfiguredError, getWeeklyDigest } = require('./serverApi');

function fieldFromList(name, values, empty = 'None') {
  return {
    name,
    value: truncate(formatList(values, { empty, limit: 12 })),
    inline: false,
  };
}

function buildDigestEmbed(digest, days = 7) {
  const title = digest.title || 'The Commonwealth Chronicle';
  const description = digest.summary || digest.description || `The last ${days} day(s) across The Commonwealth.`;
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(truncate(description, 4096))
    .setColor(0x2c7be5)
    .setTimestamp();

  if (digest.periodStart || digest.periodEnd) {
    embed.setFooter({
      text: [digest.periodStart, digest.periodEnd].filter(Boolean).join(' to '),
    });
  }

  const fields = [
    fieldFromList('Highlights', digest.highlights || digest.events, 'No major highlights reported.'),
    fieldFromList('Top Players', digest.topPlayers, 'No player activity reported.'),
    fieldFromList('Nation News', digest.nationChanges || digest.nations, 'No nation changes reported.'),
    fieldFromList('Economy', digest.economyHighlights || digest.economy, 'No economy highlights reported.'),
    fieldFromList('Upcoming', digest.upcomingEvents || digest.upcoming, 'No upcoming events reported.'),
  ];

  if (digest.stats) {
    fields.unshift({
      name: 'Stats',
      value: [
        digest.stats.uniquePlayers !== undefined ? `Players: ${formatNumber(digest.stats.uniquePlayers)}` : null,
        digest.stats.newCitizens !== undefined ? `New citizens: ${formatNumber(digest.stats.newCitizens)}` : null,
        digest.stats.deaths !== undefined ? `Deaths: ${formatNumber(digest.stats.deaths)}` : null,
        digest.stats.advancements !== undefined ? `Advancements: ${formatNumber(digest.stats.advancements)}` : null,
      ]
        .filter(Boolean)
        .join('\n') || 'No stats reported.',
      inline: false,
    });
  }

  embed.addFields(fields.slice(0, 25));
  return embed;
}

async function sendDigestToChannel(client, channelId, days = 7) {
  const digest = await getWeeklyDigest(days);
  const channel = await client.channels.fetch(channelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error('Configured digest channel is not text-based or could not be found.');
  }

  await channel.send({ embeds: [buildDigestEmbed(digest, days)] });
}

function startWeeklyDigestScheduler(client) {
  const channelId = process.env.WEEKLY_DIGEST_CHANNEL_ID;

  if (!channelId) {
    return null;
  }

  const day = Number(process.env.WEEKLY_DIGEST_DAY || 1);
  const hour = Number(process.env.WEEKLY_DIGEST_HOUR || 9);
  const days = Number(process.env.WEEKLY_DIGEST_DAYS || 7);
  let lastPostedKey = null;

  const timer = setInterval(async () => {
    const now = new Date();
    const key = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;

    if (now.getDay() !== day || now.getHours() !== hour || lastPostedKey === key) {
      return;
    }

    try {
      await sendDigestToChannel(client, channelId, days);
      lastPostedKey = key;
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        console.warn('Weekly digest is enabled, but the server API is not configured yet.');
        return;
      }

      console.error('Failed to post weekly digest:', error);
    }
  }, 15 * 60 * 1000);

  return timer;
}

module.exports = {
  buildDigestEmbed,
  sendDigestToChannel,
  startWeeklyDigestScheduler,
};
