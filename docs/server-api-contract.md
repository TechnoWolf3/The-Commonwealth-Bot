# The Commonwealth Server API Contract

This is the drop-in contract for the Minecraft mod/plugin API that powers the Discord bot features.

## Base Rules

- Base URL comes from `SERVER_API_BASE_URL`.
- Bot-to-server requests include `Authorization: Bearer <SERVER_API_KEY>` when `SERVER_API_KEY` is set.
- Return JSON for all successful responses.
- Return `404` when a player or nation does not exist.
- Return `401` for missing or invalid API keys.
- Keep response fields stable; extra fields are fine and will be ignored by the bot.

## Endpoints Needed

```text
GET  /players/{minecraftUsername}
GET  /players/online
GET  /nations/{nationName}
GET  /discord/users/{discordUserId}/balance
POST /discord/links
GET  /discord/users/{discordUserId}/role-sync
GET  /digest/weekly?days=7
```

## Rich Player Card

Used by `/player`.

```http
GET /players/{minecraftUsername}
```

Response:

```json
{
  "username": "Sheyn",
  "uuid": "00000000-0000-0000-0000-000000000000",
  "discordUserId": "123456789012345678",
  "nation": {
    "name": "Avalon"
  },
  "rank": "Minister",
  "balance": 12500,
  "online": true,
  "lastSeenAt": "2026-07-27T10:00:00Z",
  "titles": ["Founder", "Architect"],
  "avatarUrl": "https://example.com/skins/sheyn-face.png",
  "stats": {
    "kills": 8,
    "deaths": 3,
    "playtimeHours": 42,
    "advancements": 37
  }
}
```

## Online Player Intel

Used by `/online`.

```http
GET /players/online
```

Response:

```json
{
  "online": 3,
  "maxPlayers": 100,
  "players": [
    {
      "username": "Sheyn",
      "uuid": "00000000-0000-0000-0000-000000000000",
      "nation": "Avalon",
      "rank": "Minister",
      "world": "world",
      "onlineSince": "2026-07-27T09:15:00Z"
    }
  ]
}
```

## Nation Profile

Used by `/nation`.

```http
GET /nations/{nationName}
```

Response:

```json
{
  "name": "Avalon",
  "description": "A coastal republic of builders and traders.",
  "motto": "Stone, sea, and signal.",
  "color": 5793266,
  "leader": {
    "username": "Sheyn"
  },
  "memberCount": 12,
  "onlineCount": 3,
  "capital": "Avalon City",
  "balance": 50000,
  "foundedAt": "2026-07-01T00:00:00Z",
  "flagUrl": "https://example.com/flags/avalon.png",
  "allies": ["Meridia"],
  "enemies": ["Blackstone"],
  "members": [
    {
      "username": "Sheyn",
      "rank": "Minister",
      "online": true
    }
  ]
}
```

## Balance

Used by `/balance`.

```http
GET /discord/users/{discordUserId}/balance
```

Response:

```json
{
  "discordUserId": "123456789012345678",
  "playerName": "Sheyn",
  "balance": 12500,
  "currency": "coins"
}
```

## Account Linking

Used by `/link`.

```http
POST /discord/links
Content-Type: application/json
```

Request:

```json
{
  "discordUserId": "123456789012345678",
  "minecraftUsername": "Sheyn"
}
```

Response:

```json
{
  "discordUserId": "123456789012345678",
  "minecraftUsername": "Sheyn",
  "code": "483921",
  "expiresAt": "2026-07-27T11:00:00Z"
}
```

Expected in-game flow:

```text
/link 483921
```

After the player verifies in game, persist the Discord user ID against their Minecraft UUID.

## Role Sync

Used by `/syncroles`.

```http
GET /discord/users/{discordUserId}/role-sync
```

Response:

```json
{
  "discordUserId": "123456789012345678",
  "minecraftUsername": "Sheyn",
  "nation": "Avalon",
  "rank": "Minister",
  "discordRoleNames": ["Verified"]
}
```

The bot automatically derives these additional role names:

```text
Nation: Avalon
Rank: Minister
```

The prefixes are configurable with:

```env
NATION_ROLE_PREFIX=Nation: 
RANK_ROLE_PREFIX=Rank: 
```

By default, the bot only assigns roles that already exist in Discord. Set `ROLE_SYNC_CREATE_MISSING_ROLES=true` to let the bot create missing nation/rank roles.

## Weekly Digest

Used by `/digest` and optional automatic weekly posts.

```http
GET /digest/weekly?days=7
```

Response:

```json
{
  "title": "The Commonwealth Chronicle",
  "periodStart": "2026-07-20T00:00:00Z",
  "periodEnd": "2026-07-27T00:00:00Z",
  "summary": "A busy week of expansion, trade, and questionable lava safety.",
  "stats": {
    "uniquePlayers": 24,
    "newCitizens": 5,
    "deaths": 31,
    "advancements": 62
  },
  "highlights": [
    "Avalon completed its rail link to spawn.",
    "Meridia founded a public market."
  ],
  "topPlayers": [
    "Sheyn - 12h played",
    "River - 9h played"
  ],
  "nationChanges": [
    "Blackstone and Meridia signed a neutrality pact."
  ],
  "economyHighlights": [
    "Top balance: Sheyn with 12,500 coins."
  ],
  "upcomingEvents": [
    "Saturday build contest at spawn."
  ]
}
```

## Live Event Feed

The mod/plugin should send live events directly to the bot bridge endpoint, not to `SERVER_API_BASE_URL`.

```http
POST <BOT_PUBLIC_URL>/bridge/minecraft/event
Authorization: Bearer <MINECRAFT_BRIDGE_API_KEY>
Content-Type: application/json
```

Example:

```json
{
  "type": "player.death",
  "username": "Sheyn",
  "message": "Sheyn tried to swim in lava"
}
```

Use the same bridge endpoint for:

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
