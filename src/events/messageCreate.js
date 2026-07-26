const { Events } = require('discord.js');
const { forwardDiscordMessageToMinecraft } = require('../services/chatBridge');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) {
      return;
    }

    if (!process.env.DISCORD_CHAT_CHANNEL_ID || message.channelId !== process.env.DISCORD_CHAT_CHANNEL_ID) {
      return;
    }

    if (!message.content && message.attachments.size === 0) {
      return;
    }

    try {
      await forwardDiscordMessageToMinecraft(message);
    } catch (error) {
      console.error('Failed to forward Discord chat to Minecraft:', error);
    }
  },
};
