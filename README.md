# The Commonwealth Bot

A minimal Discord bot for The Commonwealth Minecraft nations server.

## Requirements

- Node.js
- A Discord application and bot token
- Application ID
- Development Discord server ID

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env` in the project root using `.env.example`:

```env
DISCORD_TOKEN=replace_me
CLIENT_ID=replace_me
GUILD_ID=replace_me
```

Register guild slash commands:

```bash
npm run deploy-commands
```

Start the bot:

```bash
npm start
```

## Railway Deployment

1. Push the project to GitHub.
2. Create a new Railway service from that repository.
3. Add `DISCORD_TOKEN`, `CLIENT_ID`, and `GUILD_ID` through Railway Variables.
4. Deploy using `npm start`.
5. Never commit `.env`.

## Project Structure

```text
.
├── src
│   ├── commands
│   │   └── ping.js
│   ├── events
│   │   ├── interactionCreate.js
│   │   └── ready.js
│   ├── deploy-commands.js
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```
