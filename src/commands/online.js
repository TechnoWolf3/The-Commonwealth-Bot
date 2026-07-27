const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { formatDate, formatList } = require('../services/formatters');
const { ServerApiNotConfiguredError, getOnlinePlayers } = require('../services/serverApi');

function getPlayers(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.players || payload.onlinePlayers || [];
}

function groupPlayersByNation(players) {
  const groups = new Map();

  for (const player of players) {
    const nation = player.nation?.name || player.nation || 'Unaffiliated';

    if (!groups.has(nation)) {
      groups.set(nation, []);
    }

    groups.get(nation).push(player);
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('online')
    .setDescription('Shows who is currently online in The Commonwealth.'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const payload = await getOnlinePlayers();
      const players = getPlayers(payload);
      const maxPlayers = payload.maxPlayers || payload.max || payload.capacity;
      const totalOnline = payload.onlineCount ?? payload.online ?? players.length;

      const embed = new EmbedBuilder()
        .setTitle('Online in The Commonwealth')
        .setColor(players.length > 0 ? 0x2ecc71 : 0x95a5a6)
        .setDescription(
          maxPlayers
            ? `**${totalOnline}/${maxPlayers}** player(s) online.`
            : `**${totalOnline}** player(s) online.`,
        )
        .setTimestamp();

      if (players.length === 0) {
        embed.addFields({ name: 'Players', value: 'No one is online right now.', inline: false });
      } else {
        for (const [nation, nationPlayers] of groupPlayersByNation(players).slice(0, 25)) {
          const names = nationPlayers.map((player) => {
            const name = player.username || player.name || 'Unknown';
            const since = player.onlineSince ? ` (${formatDate(player.onlineSince)})` : '';
            return `${name}${since}`;
          });

          embed.addFields({
            name: nation,
            value: formatList(names, { limit: 15 }),
            inline: false,
          });
        }
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        await interaction.editReply(
          'Online player intel is not connected yet. The command is ready for the server API endpoint `/players/online`.',
        );
        return;
      }

      throw error;
    }
  },
};
