const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { formatList } = require('../services/formatters');
const { syncDiscordMemberRoles } = require('../services/roleSync');
const { ServerApiNotConfiguredError, getDiscordRoleSync } = require('../services/serverApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('syncroles')
    .setDescription('Syncs Discord roles from linked Minecraft nation data.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The Discord user to sync')
        .setRequired(false),
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const user = interaction.options.getUser('user') || interaction.user;

    try {
      const syncProfile = await getDiscordRoleSync(user.id);
      const member = await interaction.guild.members.fetch(user.id);
      const result = await syncDiscordMemberRoles(member, syncProfile);

      await interaction.editReply(
        [
          `Synced roles for **${member.displayName}**.`,
          `Added: ${formatList(result.added)}.`,
          `Removed: ${formatList(result.removed)}.`,
          result.missing.length > 0
            ? `Missing roles: ${formatList(result.missing, { limit: 20 })}. Set \`ROLE_SYNC_CREATE_MISSING_ROLES=true\` if you want the bot to create them.`
            : null,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    } catch (error) {
      if (error instanceof ServerApiNotConfiguredError) {
        await interaction.editReply(
          'Role sync is not connected yet. This command is ready for the server API endpoint `/discord/users/{discordUserId}/role-sync`.',
        );
        return;
      }

      throw error;
    }
  },
};
