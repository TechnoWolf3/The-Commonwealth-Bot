const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { formatDate, formatList, formatNumber } = require('../services/formatters');
const { ServerApiNotConfiguredError, getPlayerProfile } = require('../services/serverApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('Looks up a Minecraft player profile on The Commonwealth.')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('The Minecraft username to look up')
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const username = interaction.options.getString('username', true);

    try {
      const player = await getPlayerProfile(username);
      const stats = player.stats || {};
      const discordUserId = player.discordUserId || player.discord?.id;
      const embed = new EmbedBuilder()
        .setTitle(player.username || username)
        .setColor(0x3498db)
        .addFields(
          { name: 'Nation', value: player.nation?.name || player.nation || 'None', inline: true },
          { name: 'Rank', value: player.rank || 'Unknown', inline: true },
          { name: 'Balance', value: formatNumber(player.balance ?? player.amount), inline: true },
          { name: 'Discord', value: discordUserId ? `<@${discordUserId}>` : 'Not linked', inline: true },
          { name: 'Status', value: player.online ? 'Online' : 'Offline', inline: true },
          { name: 'Last Seen', value: player.online ? 'Now' : formatDate(player.lastSeen || player.lastSeenAt), inline: true },
          { name: 'Titles', value: formatList(player.titles, { limit: 8 }), inline: false },
          {
            name: 'Stats',
            value: [
              stats.kills !== undefined ? `Kills: ${formatNumber(stats.kills)}` : null,
              stats.deaths !== undefined ? `Deaths: ${formatNumber(stats.deaths)}` : null,
              stats.playtimeHours !== undefined ? `Playtime: ${formatNumber(stats.playtimeHours)}h` : null,
              stats.advancements !== undefined ? `Advancements: ${formatNumber(stats.advancements)}` : null,
            ]
              .filter(Boolean)
              .join('\n') || 'No stats reported.',
            inline: false,
          },
        )
        .setTimestamp();

      if (player.avatarUrl || player.skinFaceUrl) {
        embed.setThumbnail(player.avatarUrl || player.skinFaceUrl);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        await interaction.editReply(
          'Player lookup is not connected yet. This command is ready for the future server API/plugin.',
        );
        return;
      }

      throw error;
    }
  },
};
