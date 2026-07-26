const { MessageFlags, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Checks whether The Commonwealth bot is online.'),

  async execute(interaction) {
    const latency = interaction.client.ws.ping;

    await interaction.reply({
      content: `Pong! Gateway latency: ${latency}ms`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
