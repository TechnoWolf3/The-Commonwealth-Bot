# Minecraft Chat Bridge Contract

This document describes the planned chat bridge between The Commonwealth Discord bot and the Minecraft server mod/plugin.

## Environment Variables

Discord bot / Railway:

```env
DISCORD_CHAT_CHANNEL_ID=
DISCORD_EVENTS_CHANNEL_ID=
MINECRAFT_BRIDGE_API_URL=
MINECRAFT_BRIDGE_API_KEY=
```

Optional for local testing:

```env
BRIDGE_HTTP_PORT=3000
```

`MINECRAFT_BRIDGE_API_KEY` is shared between the Discord bot and Minecraft mod/plugin. Do not commit it.

## Discord To Minecraft

The Discord bot sends messages from the configured Discord channel to the Minecraft server mod/plugin.

Request:

```http
POST /discord/chat
Authorization: Bearer <MINECRAFT_BRIDGE_API_KEY>
Content-Type: application/json
```

Body:

```json
{
  "discordUserId": "1234567890",
  "discordUsername": "TechnoWolf3",
  "displayName": "Techno Wolf",
  "content": "Hello from Discord",
  "attachments": []
}
```

Expected response:

```http
204 No Content
```

Any `2xx` status is treated as success by the Discord bot.

## Minecraft To Discord

The Minecraft mod/plugin sends in-game chat to the Discord bot.

Request:

```http
POST /bridge/minecraft/chat
Authorization: Bearer <MINECRAFT_BRIDGE_API_KEY>
Content-Type: application/json
```

Body:

```json
{
  "username": "MinecraftPlayer",
  "content": "Hello from Minecraft"
}
```

Expected response:

```json
{
  "ok": true
}
```

The Discord bot also accepts the API key through:

```http
X-Bridge-Api-Key: <MINECRAFT_BRIDGE_API_KEY>
```

## Minecraft Events To Discord

The Minecraft mod/plugin can also send structured server events to Discord. These go to `DISCORD_EVENTS_CHANNEL_ID` when set, otherwise they fall back to `DISCORD_CHAT_CHANNEL_ID`.

Request:

```http
POST /bridge/minecraft/event
Authorization: Bearer <MINECRAFT_BRIDGE_API_KEY>
Content-Type: application/json
```

Body:

```json
{
  "type": "player.advancement",
  "username": "MinecraftPlayer",
  "target": "Diamonds!",
  "message": "MinecraftPlayer earned advancement Diamonds!"
}
```

Supported event types:

```text
player.join
player.leave
player.death
player.advancement
nation.created
nation.join
nation.leave
nation.relation
server.alert
```

Expected response:

```json
{
  "ok": true
}
```

## Health Check

The Discord bot exposes:

```http
GET /health
```

Response:

```json
{
  "ok": true
}
```

## Loop Prevention

The Minecraft mod/plugin should not re-broadcast chat messages back to Discord when they originated from Discord. Use a source marker internally if needed.
