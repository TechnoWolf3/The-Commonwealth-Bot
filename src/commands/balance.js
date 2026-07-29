const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { formatNumber } = require('../services/formatters');
const { ServerApiNotConfiguredError, getBalanceForDiscordUser } = require('../services/serverApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Checks your linked Minecraft economy balance.'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const balance = await getBalanceForDiscordUser(interaction.user.id);
      const playerName = balance.playerName || balance.username || 'your linked account';
      const amount = balance.balance ?? balance.amount ?? 'Unknown';
      const currency = balance.currency || 'coins';

      await interaction.editReply(`Balance for **${playerName}**: **${formatNumber(amount)} ${currency}**`);
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        await interaction.editReply(
          'Balance lookup is not connected yet. Once the server API is ready, this will only show the balance for your linked Minecraft account.',
        );
        return;
      }

      throw error;
    }
  },
};
