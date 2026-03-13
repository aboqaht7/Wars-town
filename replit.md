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

## Commands
- All commands support both prefix (`-commandname`) and slash (`/commandname`) formats
- Use `npm run deploy` after adding new commands to register slash commands

## Database
- SQLite database via quick.db v9 + better-sqlite3
- Used to store per-system images (set via `/set-image` command)
- Data persists in `json.sqlite` file

## Setup Notes
- The `commands/` directory was restructured from the original GitHub import (files were in root)
- quick.db upgraded from v10 (non-existent) to v9 (latest stable)
- All db operations updated to use async/await for quick.db v9 compatibility
- Flight.js had a corrupted first line that was fixed
