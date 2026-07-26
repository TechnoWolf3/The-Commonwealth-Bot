const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');

function getRules() {
  const rulesText = process.env.RULES_TEXT;
  const rulesUrl = process.env.RULES_URL;

  if (rulesText) {
    return rulesText;
  }

  if (rulesUrl) {
    return `Read the server rules here: ${rulesUrl}`;
  }

  return [
    'Respect other players and staff.',
    'No cheating, exploiting, or automation that gives an unfair advantage.',
    'Keep nation conflicts in character and within server rules.',
    'Do not grief, steal, or bypass protections unless server rules explicitly allow it.',
    'Use common sense and keep The Commonwealth fun to play in.',
  ].join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Shows The Commonwealth server rules.')
    .addBooleanOption((option) =>
      option
        .setName('private')
        .setDescription('Show the rules only to you')
        .setRequired(false),
    ),

  async execute(interaction) {
    const privateReply = interaction.options.getBoolean('private') || false;
    const embed = new EmbedBuilder()
      .setTitle('The Commonwealth Rules')
      .setDescription(getRules())
      .setColor(0xf1c40f);

    await interaction.reply({
      embeds: [embed],
      flags: privateReply ? MessageFlags.Ephemeral : undefined,
    });
  },
};
