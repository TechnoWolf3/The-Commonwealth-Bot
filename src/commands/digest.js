const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { buildDigestEmbed } = require('../services/digest');
const { ServerApiNotConfiguredError, getWeeklyDigest } = require('../services/serverApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('digest')
    .setDescription('Posts a Commonwealth Chronicle activity digest.')
    .addIntegerOption((option) =>
      option
        .setName('days')
        .setDescription('How many days to include')
        .setMinValue(1)
        .setMaxValue(90)
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName('private')
        .setDescription('Show the digest only to you')
        .setRequired(false),
    ),

  async execute(interaction) {
    const privateReply = interaction.options.getBoolean('private') || false;
    await interaction.deferReply({ flags: privateReply ? MessageFlags.Ephemeral : undefined });

    const days = interaction.options.getInteger('days') || 7;

    try {
      const digest = await getWeeklyDigest(days);
      await interaction.editReply({ embeds: [buildDigestEmbed(digest, days)] });
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        await interaction.editReply(
          'The Commonwealth Chronicle is not connected yet. This command is ready for the server API endpoint `/digest/weekly`.',
        );
        return;
      }

      throw error;
    }
  },
};
