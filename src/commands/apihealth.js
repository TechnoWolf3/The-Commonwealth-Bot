const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { ServerApiNotConfiguredError, getServerApiHealth } = require('../services/serverApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apihealth')
    .setDescription('Checks whether the Commonwealth server API is reachable.'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const health = await getServerApiHealth();

      if (health.ok) {
        await interaction.editReply('Server API is reachable and healthy.');
        return;
      }

      await interaction.editReply('Server API responded, but did not report healthy status.');
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        await interaction.editReply('Server API is not wired yet. Add `SERVER_API_BASE_URL` once the port is confirmed.');
        return;
      }

      throw error;
    }
  },
};
