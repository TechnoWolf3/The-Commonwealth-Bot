require('dotenv').config({ quiet: true });

const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variable(s): ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (!command.data || !command.execute) {
    console.warn(`Command file "${file}" is missing a required "data" or "execute" export.`);
    continue;
  }

  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} guild slash command(s).`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Slash commands registered successfully.');
  } catch (error) {
    console.error('Failed to register slash commands.');

    if (error.code === 50001) {
      console.error('Discord returned "Missing Access" for this guild.');
      console.error('Check that GUILD_ID is the server ID for your development server.');
      console.error('Also make sure the bot was invited to that server with the "applications.commands" scope.');
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
})();
