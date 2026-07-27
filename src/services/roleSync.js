const { PermissionsBitField } = require('discord.js');
const { formatList } = require('./formatters');

function getRoleNameConfig() {
  return {
    createMissing: process.env.ROLE_SYNC_CREATE_MISSING_ROLES === 'true',
    removeStale: process.env.ROLE_SYNC_REMOVE_STALE !== 'false',
    nationPrefix: process.env.NATION_ROLE_PREFIX || 'Nation: ',
    rankPrefix: process.env.RANK_ROLE_PREFIX || 'Rank: ',
  };
}

function getDesiredRoleNames(syncProfile) {
  const config = getRoleNameConfig();
  const roleNames = new Set();

  for (const role of syncProfile.discordRoleNames || syncProfile.roleNames || []) {
    if (role) {
      roleNames.add(String(role).trim());
    }
  }

  for (const role of syncProfile.roles || []) {
    const name = typeof role === 'string' ? role : role?.name;

    if (name) {
      roleNames.add(String(name).trim());
    }
  }

  if (syncProfile.nation) {
    const nationName = typeof syncProfile.nation === 'string' ? syncProfile.nation : syncProfile.nation.name;

    if (nationName) {
      roleNames.add(`${config.nationPrefix}${nationName}`);
    }
  }

  if (syncProfile.rank) {
    const rankName = typeof syncProfile.rank === 'string' ? syncProfile.rank : syncProfile.rank.name;

    if (rankName) {
      roleNames.add(`${config.rankPrefix}${rankName}`);
    }
  }

  return [...roleNames].filter(Boolean);
}

function isManagedRoleName(roleName) {
  const config = getRoleNameConfig();
  return roleName.startsWith(config.nationPrefix) || roleName.startsWith(config.rankPrefix);
}

async function findOrCreateRole(guild, roleName) {
  const config = getRoleNameConfig();
  const existing = guild.roles.cache.find((role) => role.name === roleName);

  if (existing) {
    return existing;
  }

  if (!config.createMissing) {
    return null;
  }

  return guild.roles.create({
    name: roleName,
    reason: 'The Commonwealth role sync',
  });
}

async function syncDiscordMemberRoles(member, syncProfile) {
  const config = getRoleNameConfig();
  const me = member.guild.members.me;

  if (!me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    throw new Error('The bot needs the Manage Roles permission before it can sync roles.');
  }

  const desiredRoleNames = getDesiredRoleNames(syncProfile);
  const desiredRoles = [];
  const missingRoleNames = [];

  for (const roleName of desiredRoleNames) {
    const role = await findOrCreateRole(member.guild, roleName);

    if (role) {
      desiredRoles.push(role);
    } else {
      missingRoleNames.push(roleName);
    }
  }

  const desiredRoleIds = new Set(desiredRoles.map((role) => role.id));
  const rolesToAdd = desiredRoles.filter((role) => !member.roles.cache.has(role.id));
  const rolesToRemove = config.removeStale
    ? member.roles.cache.filter((role) => isManagedRoleName(role.name) && !desiredRoleIds.has(role.id))
    : [];

  if (rolesToAdd.length > 0) {
    await member.roles.add(rolesToAdd, 'The Commonwealth role sync');
  }

  if (rolesToRemove.size > 0) {
    await member.roles.remove([...rolesToRemove.values()], 'The Commonwealth role sync');
  }

  return {
    added: rolesToAdd.map((role) => role.name),
    removed: [...rolesToRemove.values()].map((role) => role.name),
    missing: missingRoleNames,
    desired: desiredRoleNames,
    summary: `Added: ${formatList(rolesToAdd.map((role) => role.name))}. Removed: ${formatList([...rolesToRemove.values()].map((role) => role.name))}. Missing: ${formatList(missingRoleNames)}.`,
  };
}

module.exports = {
  getDesiredRoleNames,
  syncDiscordMemberRoles,
};
