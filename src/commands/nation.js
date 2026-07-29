const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { formatDate, formatList, formatNumber, truncate } = require('../services/formatters');
const { ServerApiNotConfiguredError, ServerApiRequestError, getNationProfile } = require('../services/serverApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nation')
    .setDescription('Looks up a Commonwealth nation profile.')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('The nation name to look up')
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const nationName = interaction.options.getString('name', true);

    try {
      const nation = await getNationProfile(nationName);
      const leader = nation.leader?.username || nation.leader?.name || nation.leader || 'Unknown';
      const members = nation.members || nation.citizens || [];
      const onlineMembers = members.filter((member) => member.online);

      const embed = new EmbedBuilder()
        .setTitle(nation.name || nationName)
        .setColor(nation.color ?? 0x5865f2)
        .setDescription(truncate(nation.description || nation.motto || 'No public description set.', 4096))
        .addFields(
          { name: 'Leader', value: String(leader), inline: true },
          { name: 'Members', value: formatNumber(nation.memberCount ?? members.length), inline: true },
          { name: 'Online', value: formatNumber(nation.onlineCount ?? onlineMembers.length), inline: true },
          { name: 'Capital', value: nation.capital || nation.spawn || 'Unknown', inline: true },
          { name: 'Balance', value: formatNumber(nation.balance ?? nation.treasury), inline: true },
          { name: 'Founded', value: formatDate(nation.foundedAt || nation.createdAt), inline: true },
          { name: 'Allies', value: formatList(nation.allies, { limit: 12 }), inline: false },
          { name: 'Enemies', value: formatList(nation.enemies || nation.rivals, { limit: 12 }), inline: false },
          { name: 'Citizens', value: formatList(members, { limit: 20 }), inline: false },
        )
        .setTimestamp();

      if (nation.bannerUrl || nation.flagUrl) {
        embed.setThumbnail(nation.bannerUrl || nation.flagUrl);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        await interaction.editReply(
          'Nation profiles are not connected yet. The command is ready for the server API endpoint `/nations/{name}`.',
        );
        return;
      }

      if (error instanceof ServerApiRequestError && error.status === 404) {
        await interaction.editReply(`I could not find a nation named **${nationName}**.`);
        return;
      }

      throw error;
    }
  },
};
