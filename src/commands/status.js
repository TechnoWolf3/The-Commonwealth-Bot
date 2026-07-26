const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getServerStatus } = require('../services/minecraftStatus');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Checks the current status of The Commonwealth Minecraft server.'),

  async execute(interaction) {
    await interaction.deferReply();

    const status = await getServerStatus();

    if (!status.configured) {
      await interaction.editReply(
        'Minecraft status is not connected yet. Add `MINECRAFT_HOST` once the server is hosted.',
      );
      return;
    }

    const statusLabel = status.online
      ? 'Online'
      : status.reachable
        ? 'Port reachable, status unavailable'
        : 'Offline';
    const statusColor = status.online ? 0x2ecc71 : status.reachable ? 0xf1c40f : 0xe74c3c;

    const embed = new EmbedBuilder()
      .setTitle('The Commonwealth Server Status')
      .setColor(statusColor)
      .addFields(
        { name: 'Status', value: statusLabel, inline: true },
        { name: 'Address', value: status.address, inline: true },
        { name: 'Version', value: status.version, inline: true },
        { name: 'Players', value: `${status.players.online}/${status.players.max}`, inline: true },
      )
      .setTimestamp();

    if (!status.online && status.reachable) {
      embed.setFooter({
        text: 'The server port is reachable, but the Minecraft status ping is not returning player/version data yet.',
      });
    }

    if (status.statusError && !status.reachable) {
      embed.setFooter({
        text: 'The status provider could not be reached, and the Minecraft port did not answer from here.',
      });
    }

    if (status.motd) {
      embed.setDescription(status.motd);
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
