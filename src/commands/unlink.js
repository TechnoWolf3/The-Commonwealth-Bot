const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const {
  ServerApiNotConfiguredError,
  ServerApiRequestError,
  unlinkDiscordUser,
} = require('../services/serverApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Unlinks your Discord account from your Minecraft account.')
    .addBooleanOption((option) =>
      option
        .setName('confirm')
        .setDescription('Confirm that you want to remove your account link')
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const confirmed = interaction.options.getBoolean('confirm', true);

    if (!confirmed) {
      await interaction.editReply('No changes made. Your Minecraft account link is still intact.');
      return;
    }

    try {
      const result = await unlinkDiscordUser(interaction.user.id);
      const username = result.minecraftUsername || result.playerName || result.username;

      await interaction.editReply(
        username
          ? `Unlinked this Discord account from **${username}**.`
          : 'Unlinked this Discord account from its Minecraft account.',
      );
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        await interaction.editReply('Unlinking is not connected yet. The server API URL is missing.');
        return;
      }

      if (error instanceof ServerApiRequestError && error.status === 404) {
        await interaction.editReply('You do not have a Minecraft account linked right now.');
        return;
      }

      throw error;
    }
  },
};
