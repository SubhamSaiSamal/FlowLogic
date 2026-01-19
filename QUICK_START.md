# 🚀 Quick Start Guide

## Super Easy Setup (3 Steps!)

### Step 1: Run Setup Script ⚡

**Windows:**
```bash
setup.bat
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Or directly:**
```bash
node setup.js
```

The script will ask you for:
1. Your Supabase Project URL
2. Your Supabase Anon Key

(You can find these at: https://app.supabase.com/project/_/settings/api)

### Step 2: Run SQL Script 📊

1. Open the file `supabase-schema.sql` in this project
2. Copy ALL the contents
3. Go to: https://app.supabase.com/project/_/sql
4. Click "New Query"
5. Paste the SQL
6. Click "Run" (or press Ctrl+Enter)

✅ Done! The database table is created.

### Step 3: Enable Email Auth 📧

1. Go to: https://app.supabase.com/project/_/auth/providers
2. Find "Email" in the list
3. Make sure it's **Enabled**
4. That's it!

---

## 🎉 You're Done!

Now run:
```bash
npm run dev
```

And start using FlowLogic with full authentication! 🎊

---

## Need Help?

Check out `SUPABASE_SETUP.md` for detailed instructions and troubleshooting.
