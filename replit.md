# RP Discord Bot (بوت RP)

## Overview
A full-featured Arabic Discord roleplay (RP) bot built with Node.js and discord.js v14. It supports both traditional prefix commands (`-`) and modern slash commands.

## Architecture
- **Runtime**: Node.js 20
- **Framework**: discord.js v14
- **Database**: quick.db v9 (SQLite via better-sqlite3)
- **Config**: dotenv for environment variables

## Project Structure
```
index.js              # Main bot entry point
deploy-commands.js    # Script to register slash commands with Discord
commands/             # All bot command modules
  admin.js            # Admin system
  bag.js              # Bag/inventory system
  Band.js             # Police system
  Bank.js             # Bank/transactions system
  cars.js             # Car showroom
  Crime.js            # Crime system
  Flight.js           # Events/flights system
  health.js           # Health ministry system
  help.js             # Help menu
  identity.js         # Identity/characters system
  jobs.js             # Free jobs system
  law.js              # Law/advocacy system
  Market.js           # Market system
  phone.js            # Phone system
  properties.js       # Real estate system
  set-image.js        # Set images for systems
  Tickets.js          # Tickets system
```

## Required Environment Variables
- `DISCORD_TOKEN` - Discord bot token (secret)
- `CLIENT_ID` - Discord application client ID (for slash command deployment)
- `GUILD_ID` - Discord server ID (for slash command deployment)
- `PREFIX` - Command prefix (default: `-`)
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)

## Commands
- All commands support both prefix (`-commandname`) and slash (`/commandname`) formats
- Use `npm run deploy` after adding new commands to register slash commands

## Database
- PostgreSQL via Replit's built-in database + `pg` package
- Database module: `database.js` — exports helper functions used by all commands
- Tables:
  - `users` — Discord user profiles
  - `bank_accounts` — per-user balances
  - `inventory` — per-user bag items
  - `identities` — character slots (up to 4 per user)
  - `system_images` — images set per system via `/set-image`
  - `tickets` — support ticket records
  - `crimes` — crime event records
  - `vehicles` — owned vehicles per user
  - `properties` — owned properties per user

## Setup Notes
- The `commands/` directory was restructured from the original GitHub import (files were in root)
- Migrated from quick.db (SQLite) to PostgreSQL for persistent, structured data storage
- Flight.js had a corrupted first line that was fixed
- `clientReady` event used instead of deprecated `ready`
