# Wars-town Discord Bot (بوت Wars-town)

An Arabic Discord roleplay (RP) bot — the independent second instance of the RP bot system, running separately from the original Fantasy-bot.

## Run & Operate

| Command | Purpose |
|---|---|
| `npm start` | Start the bot (runs `node index.js`) |
| `npm run deploy` | Register / update slash commands with Discord (run once after adding commands) |

### Required Secrets (all configured in this Repl)

| Secret | Description | Status |
|---|---|---|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal | Configured |
| `CLIENT_ID` | Discord application ID | Configured |
| `GUILD_ID` | Target Discord server ID | Configured |
| `DATABASE_URL` | PostgreSQL connection string | Configured (Replit managed DB) |
| `PREFIX` | Command prefix (default `-`) | Set to `-` |

> **Database**: Replit's built-in PostgreSQL is provisioned. All tables are auto-created on first start via `database.js → initializeDatabase()`. No manual schema setup needed.

## Stack

- **Runtime**: Node.js 20
- **Framework**: discord.js v14
- **Database**: PostgreSQL (Replit managed, `pg` driver, `DATABASE_URL`)
- **Config**: dotenv

## Where things live

```
index.js              # Main entry: gateway, intervals, dispatchers
deploy-commands.js    # Registers slash commands with Discord REST API
database.js           # PostgreSQL data layer + all table init (initializeDatabase)
loggers.js            # Audit log helper (logEvent + LOG_TYPES)
backup.js             # pg_dump-based DB backup helper
btnConfig.js          # Button configuration
utils.js              # Shared helpers (isAdmin, etc.)
commands/             # All bot commands (125+ files, prefix + slash)
trackingHelpers.js    # CIA tracking code-word helpers
```

## Architecture decisions

- All tables are created automatically via `initializeDatabase()` in `database.js` — no manual migrations needed on new instances.
- Prefix commands use `PREFIX` env var (default `-`); slash commands need `npm run deploy` run once per instance.
- This instance is fully independent: separate DB, separate `DISCORD_TOKEN`, separate `CLIENT_ID` — changes here do not affect the original Fantasy-bot.
- Audit log channels are stored as PostgreSQL config keys (not env vars), configured via slash commands after first start.
- Duration parser accepts both English (`30m`, `2h`, `1d`) and Arabic (`30دقيقة`, `2ساعة`, `7يوم`) formats.

## Product

- Full Arabic RP bot: ban/unban system (bands), CIA tracking, character system, trips, tickets, identity cards, marketplace, database backups, audit logs.
- Supports both prefix commands (`-`) and slash commands.
- Auto-expires temporary bans, restores roles, and sends DMs in Arabic.

## User preferences

- Arabic UI throughout (responses, embeds, command names).
- Command prefix is `-`.

## Gotchas

- **Slash commands must be re-registered after any change**: run `npm run deploy` from the Shell after first start, after adding new commands, or after renaming/removing existing ones. Without this, changes to slash commands won't appear in Discord. Confirmed working as of 2026-05-06.
- **Log channels**: configured per-server via `/تعيين-لوق` slash command after bot is running — not set via env vars.
- **`pg_dump` backups** require PostgreSQL 16 tools to be present (included in `.replit` nix channel).

## Verified Setup (Wars-town independent instance)

The following was verified on 2026-05-06 during initial setup of this Repl:

**Database**: Replit built-in PostgreSQL provisioned — `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` all set as Replit managed secrets.

**Secrets configured** (stored in Replit Secrets, not in git):
- `DISCORD_TOKEN` — Wars-town bot token
- `CLIENT_ID` — Wars-town Discord application ID
- `GUILD_ID` — Target server ID
- `DATABASE_URL` — Replit managed PostgreSQL connection string
- `PREFIX` — set to `-` via shared env var

**Bot startup confirmed** (`npm start` output):
```
✅ Logged in as FT|BOT!#0232
✅ تم ضبط رسائل الرحلات
```

**Slash commands registered** (`npm run deploy` output):
```
⏳ بدأ تسجيل أوامر Slash...
✅ تم تسجيل جميع أوامر Slash بنجاح
```

This Repl is independent from the original Fantasy-bot — different `DISCORD_TOKEN`, different database (separate Replit PostgreSQL instance), separate `GUILD_ID`.

## Pointers

- [discord.js v14 docs](https://discord.js.org/)
- [Replit Secrets management](.local/skills/environment-secrets/SKILL.md)
- [Replit Database skill](.local/skills/database/SKILL.md)
