# Linking API Drop-In For The Minecraft Mod

Codex has added the bot-side commands `/linkstatus` and `/unlink`. The existing `POST /discord/links` endpoint can stay as-is. Add these two endpoints to complete the Discord-side linking flow.

## Existing Endpoint To Keep

```http
POST /discord/links
Authorization: Bearer <SERVER_API_KEY>
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

```http
201 Created
```

```json
{
  "discordUserId": "123456789012345678",
  "minecraftUsername": "Sheyn",
  "code": "483921",
  "expiresAt": "2026-07-29T02:10:00Z"
}
```

## Add: Link Status

```http
GET /discord/users/{discordUserId}/link
Authorization: Bearer <SERVER_API_KEY>
```

Return `200 OK` for all normal states: linked, pending, or not linked. Do not use `404` for "not linked" on this endpoint, because the bot uses `404` as a useful signal elsewhere and `200` keeps this status command calm.

Confirmed linked:

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

Pending but not confirmed:

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

No link or pending code:

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

## Add: Unlink

```http
DELETE /discord/users/{discordUserId}/link
Authorization: Bearer <SERVER_API_KEY>
```

Behavior:

- Remove the confirmed Discord-to-Minecraft link if one exists.
- Also clear any pending link for that Discord user.
- Do not delete the Minecraft player data.
- Do not touch balance, nation membership, rank, stats, or inventory.
- Return `404` only if there was no confirmed link and no pending link to remove.

Preferred success response:

```http
200 OK
```

```json
{
  "ok": true,
  "unlinked": true,
  "discordUserId": "123456789012345678",
  "minecraftUsername": "Sheyn",
  "minecraftUuid": "00000000-0000-0000-0000-000000000000"
}
```

Also acceptable:

```http
204 No Content
```

No link response:

```http
404 Not Found
Content-Type: application/json
```

```json
{
  "error": "No linked Minecraft account found."
}
```

## Bot Behavior Already Implemented

- `/link <username>` starts or replaces a pending link and shows the 6-digit in-game code privately.
- `/linkstatus` shows the confirmed linked player, nation, rank, linked date, or pending code privately.
- `/unlink confirm:true` removes the link privately.
- `/unlink confirm:false` makes no changes.
- Bot API helpers accept both JSON success and `204 No Content`.
