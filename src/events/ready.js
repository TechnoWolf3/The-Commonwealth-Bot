const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`The Commonwealth is online as ${client.user.tag}`);
    console.log(`Loaded ${client.commands.size} slash command(s).`);
  },
};
