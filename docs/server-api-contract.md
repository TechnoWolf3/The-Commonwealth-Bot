# The Commonwealth Server API Contract

This is the drop-in contract for the Minecraft mod/plugin API that powers the Discord bot features.

## Base Rules

- Base URL comes from `SERVER_API_BASE_URL`.
- Bot-to-server requests include `Authorization: Bearer <SERVER_API_KEY>` when `SERVER_API_KEY` is set.
- Return JSON for all successful responses.
- `GET /health` returns `{"ok":true}` and does not require auth.
- Return `404` when a player or nation does not exist.
- Return `401` for missing or invalid API keys.
- Keep response fields stable; extra fields are fine and will be ignored by the bot.

## Endpoints Needed

```text
GET  /health
GET  /players/{minecraftUsername}
GET  /players/online
GET  /nations/{nationName}
GET  /discord/users/{discordUserId}/balance
POST /discord/links
GET  /discord/users/{discordUserId}/link
DELETE /discord/users/{discordUserId}/link
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

`nation` is either an object with `name` or `null`. `rank` is either a string or `null`. `avatarUrl` can point to an external skin face render such as Crafatar.

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
      "world": "minecraft:overworld",
      "onlineSince": "2026-07-27T09:15:00Z"
    }
  ]
}
```

`world` may be a raw dimension key.

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

Nation lookup should match display name or internal id case-insensitively. Nullable fields should be returned as `null`, not omitted.

Implementation notes:

- `description` is separate from `motto` and starts `null` until set in-game.
- `foundedAt` is an ISO-8601 instant and may be `null` for nations created before tracking existed.
- `capital` is a friendly display name and may be `null`.
- `balance` is currently computed from member personal balances, not a separate treasury.
- `allies` and `enemies` are symmetric nation relationships.
- `color` is a raw Minecraft chat formatting color integer or `null`.

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
  "currency": "Common Dollars"
}
```

## Account Linking

Used by `/link`, `/linkstatus`, and `/unlink`.

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

Return `201 Created` on success. A new pending link for the same Discord user or same Minecraft account can replace the previous unclaimed one.

Expected in-game flow:

```text
/link 483921
```

After the player verifies in game, persist the Discord user ID against their Minecraft UUID.

### Link Status

Used by `/linkstatus`.

```http
GET /discord/users/{discordUserId}/link
```

Return `200` even when there is no link. This avoids ambiguity between "not linked" and "endpoint missing".

Confirmed linked response:

```json
{
  "discordUserId": "123456789012345678",
  "linked": true,
  "minecraftUsername": "Sheyn",
  "minecraftUuid": "00000000-0000-0000-0000-000000000000",
  "linkedAt": "2026-07-29T02:00:00Z",
  "nation": "Avalon",
  "rank": "Minister",
  "pending": null
}
```

Pending response:

```json
{
  "discordUserId": "123456789012345678",
  "linked": false,
  "minecraftUsername": null,
  "minecraftUuid": null,
  "linkedAt": null,
  "nation": null,
  "rank": null,
  "pending": {
    "minecraftUsername": "Sheyn",
    "code": "483921",
    "expiresAt": "2026-07-29T02:10:00Z"
  }
}
```

No link response:

```json
{
  "discordUserId": "123456789012345678",
  "linked": false,
  "minecraftUsername": null,
  "minecraftUuid": null,
  "linkedAt": null,
  "nation": null,
  "rank": null,
  "pending": null
}
```

### Unlink

Used by `/unlink`.

```http
DELETE /discord/users/{discordUserId}/link
```

Return `200` with JSON or `204 No Content` on success. Prefer `200` with the removed account name so the bot can confirm clearly.

```json
{
  "ok": true,
  "unlinked": true,
  "discordUserId": "123456789012345678",
  "minecraftUsername": "Sheyn",
  "minecraftUuid": "00000000-0000-0000-0000-000000000000"
}
```

If the Discord user has no confirmed link or pending link, return:

```http
404 Not Found
```

```json
{
  "error": "No linked Minecraft account found."
}
```

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

Clamp `days` to `1` through `90`.

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

The server can return empty arrays for narrative fields such as `highlights`, `nationChanges`, and `upcomingEvents`. The bot will show calm fallback text instead of inventing story content.

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
