# File Organization Migration Guide

## Summary of Changes

All configuration and test files have been reorganized for better project structure.

## 📁 New File Locations

### Configuration Files (moved to `config/`)
- `.env.example` → `config/.env.example`
- `.env.local` → `config/.env.local`
- `.env.db.example` → `config/.env.db.example`
- `.env.db.local` → `config/.env.db.local`
- `.env.email.example` → `config/.env.email.example`
- `.env.server.example` → `config/.env.server.example`
- `.env.server.local` → `config/.env.server.local`

**Note:** The main `.env` file remains in the project root.

### Test Files (moved to `tests/`)
- `test-auth.js` → `tests/test-auth.js`
- `server/test-email.js` → `tests/test-email.js`

### Setup Scripts (moved to `scripts/setup/`)
- `setup-email-config.js` → `scripts/setup/setup-email-config.js`

## 🔧 Updated File References

All the following files have been updated to reference the new paths:

### Backend Files
- ✅ `server/services/emailService.js` - Updated dotenv path
- ✅ `server/routes/email.js` - Updated dotenv path
- ✅ `tests/test-email.js` - Updated import and dotenv paths

### Scripts
- ✅ `scripts/run-sql.js` - Updated to check `config/.env.db.local`
- ✅ `scripts/ping-supabase.js` - Updated to check `config/.env.local`
- ✅ `scripts/migrate-teacher-role.js` - Updated dotenv path
- ✅ `scripts/manage-teachers.js` - Updated dotenv path
- ✅ `scripts/create-admin.js` - Updated error messages
- ✅ `scripts/setup/setup-email-config.js` - Updated paths

### Configuration Files
- ✅ `package.json` - Updated npm scripts to use `config/.env.server.local`
- ✅ `.gitignore` - Updated to reference `config/` directory
- ✅ `README.md` - Added project structure section

## 📝 Important Notes

### For Development

**Environment variables are now loaded from `config/` directory:**
```bash
# Start development server
npm run dev
# This uses: config/.env.server.local
```

### For Scripts

**All scripts now reference the config directory:**
```bash
# Create admin user
npm run admin:create
# Reads from: config/.env.server.local

# Test email
node tests/test-email.js
# Reads from: config/.env.server.local

# Setup database
npm run db:setup
# Reads from: config/.env.db.local
```

### For Documentation

⚠️ **Documentation files in `docs/` directory contain outdated path references.**

When reading documentation, replace:
- `.env.server.local` → `config/.env.server.local`
- `.env.local` → `config/.env.local`
- `.env.db.local` → `config/.env.db.local`
- `server/test-email.js` → `tests/test-email.js`
- `setup-email-config.js` → `scripts/setup/setup-email-config.js`

## 🚀 Quick Start After Migration

1. **Verify config files exist:**
   ```bash
   dir config
   ```

2. **Run your development server:**
   ```bash
   npm run dev
   ```

3. **Test email functionality:**
   ```bash
   node tests/test-email.js
   ```

## 🔍 Troubleshooting

### "Cannot find .env.server.local"
- **Cause:** Script looking in wrong directory
- **Solution:** Check that file exists in `config/.env.server.local`

### "Missing environment variables"
- **Cause:** Config files not in the right location
- **Solution:** Ensure all `.env.*` files are in the `config/` directory

### Script errors
- **Cause:** Old cached references
- **Solution:** Restart your terminal/IDE and run `npm install` again

## ✅ Verification Checklist

- [ ] All `.env.*` files are in `config/` directory
- [ ] Test files are in `tests/` directory
- [ ] Setup scripts are in `scripts/setup/` directory
- [ ] `npm run dev` starts successfully
- [ ] `npm run admin:create` works
- [ ] `node tests/test-email.js` can find the email service

## 📚 Additional Resources

- See `config/README.md` for configuration file documentation
- See `README.md` for updated project structure
- Check `.gitignore` to ensure sensitive config files are excluded

---

**Last Updated:** October 21, 2025
**Migration Version:** 1.0
