const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');
const { formatDate } = require('../services/formatters');
const {
  ServerApiNotConfiguredError,
  ServerApiRequestError,
  getDiscordLinkStatus,
} = require('../services/serverApi');

function getLinkedUsername(status) {
  return status.minecraftUsername || status.playerName || status.username || status.player?.username;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('linkstatus')
    .setDescription('Shows your linked Minecraft account status.'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const status = await getDiscordLinkStatus(interaction.user.id);
      const pending = status.pendingLink || status.pending;
      const username = getLinkedUsername(status);

      if (status.linked || username) {
        const nation = status.nation?.name || status.nation || 'None';
        const rank = status.rank || 'None';
        const linkedAt = formatDate(status.linkedAt || status.createdAt);

        const embed = new EmbedBuilder()
          .setTitle('Minecraft Account Linked')
          .setColor(0x2ecc71)
          .addFields(
            { name: 'Minecraft', value: username || 'Unknown', inline: true },
            { name: 'Nation', value: nation, inline: true },
            { name: 'Rank', value: rank, inline: true },
            { name: 'Linked', value: linkedAt, inline: true },
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (pending) {
        const pendingUsername = pending.minecraftUsername || pending.username || 'Unknown';
        const code = pending.code ? ` Code: **${pending.code}**.` : '';
        const expires = pending.expiresAt ? ` Expires ${formatDate(pending.expiresAt)}.` : '';

        await interaction.editReply(
          `You have a pending link for **${pendingUsername}**.${code}${expires} Join Minecraft and run \`/link <code>\` in-game to finish.`,
        );
        return;
      }

      await interaction.editReply('You do not have a Minecraft account linked yet. Use `/link <username>` to start.');
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        await interaction.editReply('Link status is not connected yet. The server API URL is missing.');
        return;
      }

      if (error instanceof ServerApiRequestError && error.status === 404) {
        await interaction.editReply('You do not have a Minecraft account linked yet. Use `/link <username>` to start.');
        return;
      }

      throw error;
    }
  },
};
