# Configuration Files

This directory contains all environment configuration files for the Echoverse Support System.

## Files

- **`.env.example`** - Template for main environment variables
- **`.env.local`** - Local environment configuration (not in git)
- **`.env.db.example`** - Database configuration template
- **`.env.db.local`** - Local database configuration (not in git)
- **`.env.email.example`** - Email service configuration template
- **`.env.email.local`** - Local email configuration (not in git)
- **`.env.server.example`** - Server configuration template
- **`.env.server.local`** - Local server configuration (not in git)

## Setup Instructions

1. Copy the `.example` files and remove the `.example` suffix
2. Fill in your actual configuration values
3. Never commit files without `.example` to version control

## Note

The main `.env` file remains in the project root for compatibility with tools that expect it there.
