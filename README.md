# The Commonwealth Bot

A modular Discord bot for The Commonwealth Minecraft nations server.

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
MINECRAFT_HOST=
MINECRAFT_PORT=25565
SERVER_API_BASE_URL=
SERVER_API_KEY=
RULES_URL=
RULES_TEXT=
DISCORD_CHAT_CHANNEL_ID=
DISCORD_EVENTS_CHANNEL_ID=
MINECRAFT_BRIDGE_API_URL=
MINECRAFT_BRIDGE_API_KEY=
BRIDGE_HTTP_PORT=
ROLE_SYNC_ENABLED=false
ROLE_SYNC_CREATE_MISSING_ROLES=false
ROLE_SYNC_REMOVE_STALE=true
NATION_ROLE_PREFIX=Nation: 
RANK_ROLE_PREFIX=Rank: 
WEEKLY_DIGEST_CHANNEL_ID=
WEEKLY_DIGEST_DAY=1
WEEKLY_DIGEST_HOUR=9
WEEKLY_DIGEST_DAYS=7
```

`MINECRAFT_HOST` is optional until the Minecraft server is hosted. `SERVER_API_BASE_URL` and `SERVER_API_KEY` are placeholders for the future server plugin/API that will power linking, balance, and player lookups.

`DISCORD_CHAT_CHANNEL_ID`, `MINECRAFT_BRIDGE_API_URL`, and `MINECRAFT_BRIDGE_API_KEY` power the future two-way Minecraft chat bridge. Leave them blank until the server mod/plugin is ready.

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
4. Add optional Minecraft variables as the server/API becomes available.
5. Deploy using `npm start`.
6. Never commit `.env`.

## Commands

- `/apihealth` privately checks whether the configured server API is reachable.
- `/ping` checks Discord gateway latency.
- `/status` checks Minecraft server status once `MINECRAFT_HOST` is configured.
- `/balance` privately checks the linked player's balance once the server API exists.
- `/digest` posts a Commonwealth Chronicle activity digest once the server API exists.
- `/rules` shows the server rules.
- `/link` prepares Discord-to-Minecraft account linking.
- `/nation` looks up a nation profile once the server API exists.
- `/online` shows online players once the server API exists.
- `/player` looks up a Minecraft player profile once the server API exists.
- `/syncroles` syncs Discord roles from linked Minecraft nation/rank data once the server API exists.

## Minecraft Chat Bridge

The bot includes a framework for two-way Minecraft chat:

- Discord messages from `DISCORD_CHAT_CHANNEL_ID` are forwarded to the Minecraft bridge API.
- Minecraft chat events can be sent back to the bot at `POST /bridge/minecraft/chat`.
- Minecraft server events can be sent back to the bot at `POST /bridge/minecraft/event`.
- Both directions use `MINECRAFT_BRIDGE_API_KEY`.

See [docs/minecraft-chat-bridge-contract.md](docs/minecraft-chat-bridge-contract.md) for the mod/plugin contract.
See [docs/server-api-contract.md](docs/server-api-contract.md) for the API endpoints that power player cards, online player intel, nation profiles, role sync, and the weekly digest.

To read normal Discord channel messages, enable **Message Content Intent** in the Discord Developer Portal before setting `DISCORD_CHAT_CHANNEL_ID`.

## Project Structure

```text
.
|-- src
|   |-- commands
|   |   |-- balance.js
|   |   |-- link.js
|   |   |-- ping.js
|   |   |-- player.js
|   |   |-- rules.js
|   |   `-- status.js
|   |-- events
|   |   |-- interactionCreate.js
|   |   |-- messageCreate.js
|   |   `-- ready.js
|   |-- services
|   |   |-- chatBridge.js
|   |   |-- minecraftStatus.js
|   |   |-- minecraftBridgeServer.js
|   |   `-- serverApi.js
|   |-- deploy-commands.js
|   `-- index.js
|-- .env.example
|-- .gitignore
|-- package-lock.json
|-- package.json
`-- README.md
```
