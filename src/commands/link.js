const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { ServerApiNotConfiguredError, ServerApiRequestError, startAccountLink } = require('../services/serverApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Links your Discord account to your Minecraft username.')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('Your Minecraft username')
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const username = interaction.options.getString('username', true);

    try {
      const link = await startAccountLink(interaction.user.id, username);
      const code = link.code || link.verificationCode;

      if (code) {
        await interaction.editReply(
          `Started linking **${username}**. Join the Minecraft server and run the verification command with code **${code}**.`,
        );
        return;
      }

      await interaction.editReply(`Started linking **${username}**. Follow the in-game verification prompt to finish.`);
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        await interaction.editReply(
          `Linking is not connected yet. Framework ready: this command will link your Discord account to **${username}** once the server API/plugin exists.`,
        );
        return;
      }

      if (error instanceof ServerApiRequestError && error.status === 404) {
        await interaction.editReply(
          `I could not find a Minecraft account named **${username}**. Check the spelling, then try again.`,
        );
        return;
      }

      throw error;
    }
  },
};
