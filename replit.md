# RP Discord Bot (بوت RP)

## Overview
A full-featured Arabic Discord roleplay (RP) bot built with Node.js and discord.js v14. Supports both prefix commands (`-`) and slash commands.

## Architecture
- **Runtime**: Node.js 20
- **Framework**: discord.js v14
- **Database**: PostgreSQL (via `pg` driver, `DATABASE_URL` env var)
- **Config**: dotenv

## Project Structure
```
index.js              # Main entry: gateway, intervals, dispatchers
deploy-commands.js    # Registers slash commands with Discord
database.js           # PostgreSQL data layer + table init
loggers.js            # Audit log helper (logEvent + LOG_TYPES)
backup.js             # pg_dump-based DB backup helper
btnConfig.js          # Button configuration
utils.js              # Shared helpers (isAdmin, etc.)
commands/             # All bot commands (125+ files, prefix + slash)
```

## Ban / Band System
- **Active table**: `bands` (PostgreSQL). Old `violations` table fully removed.
- **Commands** (prefix `-`):
  - `-باند @user [duration] [reason]` — temporary ban with role save
  - `-مخالف` — alias, delegates to `-باند`
  - `-فك-باند @user` — manual unban + role restoration
  - `-فك-مخالف` — alias, delegates to `-فك-باند`
  - Permanent bans: `-شقلب`, `-بنعالي`, `-تفوو`, `-بنعال-ابو-قحط`, `-بنعال-عسيري`, `-بنعال-الشريف`, `-بنعال-مشاري` (all Arabic responses + audit log)
- **Setup slash commands**:
  - `/تعيين-مسؤولين-رتبة-الباند` — sets the role allowed to ban
  - `/تعيين-رتبة-مبند` — sets the role applied during a ban
- **Auto-cleanup**: every 60s, expired bands lose the band role and have all saved roles restored. Sends Arabic DM + audit log embed.
- Duration parser accepts: `30m`, `2h`, `1d`, `1w`, `30دقيقة`, `2ساعة`, `7يوم`, `1أسبوع`.

## Audit Log System
- Helper: `loggers.js` exports `logEvent(client, db, type, embed)` and `LOG_TYPES`.
- Channels are stored as PostgreSQL config keys: `band_log_channel`, `config_log_channel`, `backup_log_channel`, `tracking_log_channel`, `general_log_channel` (used as fallback).
- Slash commands:
  - `/تعيين-لوق` — set the channel for a given log type (band / config / backup / tracking / general)
  - `/عرض-لوقات` — display all currently configured log channels
- Existing per-system log channels still in use: `trip_log_channel`, `identity_log_channel`, `character_log_channel`, `activation_log_channel`, `ticket_log_channel`.
- Auto-logged events:
  - All band/unban operations (manual + auto-expiry)
  - All 7 perma-ban commands
  - Every `/تعيين-*` and `/إعداد-*` slash command (logged via dispatcher wrapper in `index.js`)

## CIA Tracking System (تراكينق)
- **Two button types** + slash command + customizable via `/تخصيص-زر`:
  - `tracking_btn` (عادي) — 2-hour cooldown per agent, blocked on protected roles
  - `tracking_president_btn` (للرؤساء) — 2 uses per agent per 30 days, only allowed on protected roles
  - `/تراكينق [النوع]` — slash command alternative (opens same modal)
- **Code system**: random Arabic word from `trackingHelpers.js` (~64 words), letters split with spaces (e.g. `م ج ت ه د`); target sends back joined (`مجتهد`). Matcher in `trackingHelpers.matchesCode()` normalizes spaces, diacritics, and alef/yaa variants.
- **Protected roles** (رؤساء الحكومة): stored as JSON array in config key `tracking_protected_roles`. Managed via:
  - `/رتب-محمية-تراكينق اضافة | ازاله | عرض | مسح` (Admin only)
- **Database**: `tracking_logs` table (id, agent_id, target_id, type, code_word, result, created_at) with helpers `addTrackingLog`, `getLastTrackingByAgent`, `getPresidentTrackingCountThisMonth`, `updateTrackingLogResult`, `getTrackingProtectedRoles`, `setTrackingProtectedRoles`.
- **Sessions** (in-memory `trackingSessions` Map in `index.js`): `{ codeWord, trackerId, channelId, guildId, timer, type, logId }`.
- **Timeout**: 20s. On timeout → log `success`. On DM cancel with correct word → log `canceled`.
- **Logging**: every start/success/cancel sends an embed via `logEvent(client, db, 'tracking', ...)` to `tracking_log_channel`.
- **Button customization**: system key `cia_tracking` with btn keys `normal` and `president` registered in `btnConfig.js` (DEFAULTS, SYSTEM_LABELS, BTN_LABELS).
- **Panel**: rendered as row3 in `commands/CIA.js`.

## Database Backup
- Helper: `backup.js` uses `pg_dump` (PostgreSQL 16) to create SQL dumps in `/tmp/fantasy_backups/`.
- `/نسخة-احتياطية` — manual trigger, uploads the dump file to `backup_log_channel`.
- Daily auto-backup at **03:00 server time** via `setTimeout`-based scheduler in `index.js`.
- Local rotation: keeps the last 7 backup files.

## Required Environment Variables
- `DISCORD_TOKEN` — Discord bot token
- `CLIENT_ID` — Discord application ID (slash deploy)
- `GUILD_ID` — Discord server ID (slash deploy)
- `DATABASE_URL` — PostgreSQL connection string
- `PREFIX` — command prefix (default `-`)

## How to Add a New Slash Command
1. Create `commands/<name>.js` exporting `{ name, data: SlashCommandBuilder, slashExecute(interaction, db) }`.
2. Run `npm run deploy` (or `node deploy-commands.js`) to register with Discord.
3. The command is auto-loaded on next bot start.

## Workflow
- `Start application` → `npm start` → `node index.js`
