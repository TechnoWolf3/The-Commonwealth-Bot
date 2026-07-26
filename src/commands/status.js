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

    const embed = new EmbedBuilder()
      .setTitle('The Commonwealth Server Status')
      .setColor(status.online ? 0x2ecc71 : 0xe74c3c)
      .addFields(
        { name: 'Status', value: status.online ? 'Online' : 'Offline', inline: true },
        { name: 'Address', value: status.address, inline: true },
        { name: 'Version', value: status.version, inline: true },
        { name: 'Players', value: `${status.players.online}/${status.players.max}`, inline: true },
      )
      .setTimestamp();

    if (status.motd) {
      embed.setDescription(status.motd);
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
