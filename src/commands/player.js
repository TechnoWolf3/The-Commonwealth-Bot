const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
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
      const embed = new EmbedBuilder()
        .setTitle(player.username || username)
        .setColor(0x3498db)
        .addFields(
          { name: 'Nation', value: player.nation || 'None', inline: true },
          { name: 'Rank', value: player.rank || 'Unknown', inline: true },
          { name: 'Balance', value: String(player.balance ?? 'Unknown'), inline: true },
          { name: 'Last Seen', value: player.lastSeen || 'Unknown', inline: true },
        )
        .setTimestamp();

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
