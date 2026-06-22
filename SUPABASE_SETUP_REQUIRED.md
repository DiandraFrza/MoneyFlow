<!-- @format -->

# ⚙️ Supabase Setup Guide - REQUIRED Configuration

> **⚠️ IMPORTANT: MoneyFlow Pro REQUIRES Supabase. There is NO fallback to local/guest mode.**

## 📋 Table of Contents

1. [Quick Setup (5 minutes)](#quick-setup)
2. [Step-by-Step Guide](#step-by-step-guide)
3. [Troubleshooting](#troubleshooting)
4. [What Changed](#what-changed)

---

## 🚀 Quick Setup

### Step 1: Create Supabase Account

Go to [supabase.com](https://supabase.com) dan buat akun gratis

### Step 2: Create New Project

- Click **"New Project"**
- Name: `MoneyFlow` (or your preferred name)
- Password: Create a strong password
- Region: Choose nearest to you
- Click **"Create new project"**

### Step 3: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (under "API URL")
   - **Anon Key** (under "Project API keys")

### Step 4: Create .env.local File

In root directory, create file `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Restart Dev Server

```bash
npm run dev
```

✅ **Done!** App should now work.

---

## 📖 Step-by-Step Guide

### 1️⃣ Go to Supabase

```
https://supabase.com
```

### 2️⃣ Sign In / Sign Up

- Click **"Sign In"**
- Use Google, GitHub, atau email
- Complete verification

### 3️⃣ Create New Project

```
Dashboard → New Project
```

**Fill in:**

- **Project Name:** `MoneyFlow` (or any name)
- **Database Password:** Strong password (save it!)
- **Region:** Select nearest to your location
- **Pricing Plan:** Free (unlimited for development)

**Click:** `Create new project`

_Wait 2-3 minutes for setup..._

### 4️⃣ Get API Credentials

After project is created:

1. Go to **Settings** (bottom left icon)
2. Click **"API"** tab
3. You'll see:

```
Project URL:
https://xxxxxxxxxxx.supabase.co

Project API keys:
- anon (public):
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5️⃣ Create Environment File

In your project root (`d:\laragon\www\MoneyFlow\`), create file:

**File: `.env.local`**

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important:**

- Replace with YOUR actual values
- Do NOT commit `.env.local` to git (add to `.gitignore`)

### 6️⃣ Create Database Tables

Go to Supabase Dashboard → SQL Editor:

**Execute this SQL to create tables:**

```sql
-- Profiles table
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'IDR',
  monthly_salary NUMERIC DEFAULT 0,
  financial_target NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  low_balance_threshold NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallets
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  category_id TEXT,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Debts
CREATE TABLE debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  creditor_name TEXT NOT NULL,
  principal NUMERIC NOT NULL,
  interest_rate NUMERIC DEFAULT 0,
  remaining_amount NUMERIC NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'active',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recurring transactions
CREATE TABLE recurring (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  category_id TEXT,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7️⃣ Restart Development Server

```bash
npm run dev
```

✅ **App should now work with Supabase!**

---

## 🔍 Verify Setup

After restart, check:

1. **No error page** - ✅ If SupabaseConfigError page gone
2. **Login works** - ✅ Can see login form
3. **Can register** - ✅ Can create new account

---

## 🐛 Troubleshooting

### Problem: "Supabase Not Configured" Error Page

**Solution:**

- Check `.env.local` file exists
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- **Restart dev server** with `npm run dev`

### Problem: ".env.local file not found"

**Solution:**

1. In root directory, create new file: `.env.local`
2. Add your Supabase credentials
3. Save file
4. Restart `npm run dev`

### Problem: "Invalid Supabase credentials"

**Solution:**

- Go back to Supabase dashboard
- Check **Settings → API**
- Copy credentials again (make sure no extra spaces)
- Update `.env.local`
- Restart dev server

### Problem: "Database tables don't exist"

**Solution:**

- Go to Supabase dashboard
- Open **SQL Editor**
- Paste the SQL tables creation script above
- Click **Run**
- Wait for completion

### Problem: "Authentication not working"

**Solution:**

- Check Supabase Auth is enabled
- Go to **Authentication** in Supabase
- Verify **Email/Password** is enabled
- Check **Site URL** is set correctly

---

## 📝 .env.local Examples

### Valid Format ✅

```env
VITE_SUPABASE_URL=https://abc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyMyIsInJvbGUiOiJhbm9uIn0.abcd1234
```

### Invalid Format ❌

```env
# Missing credentials
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=

# Extra spaces
VITE_SUPABASE_URL = https://abc123.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...

# Wrong format
SUPABASE_URL=https://abc123.supabase.co
```

---

## 🔐 Security Notes

### ✅ DO:

- Keep `.env.local` **private** (never commit to git)
- Add `.env.local` to `.gitignore`
- Use **Anon Key** for frontend (not Service Role Key)
- Rotate keys periodically

### ❌ DON'T:

- Share credentials publicly
- Commit `.env.local` to git
- Use production database for testing
- Share Service Role Key with frontend

### .gitignore Entry:

```
# Environment variables
.env.local
.env.*.local
```

---

## 🔄 What Changed (Version 2.0)

### Breaking Changes

- ❌ **Removed** mode lokal/guest fallback
- ❌ **Removed** localStorage-based auth
- ✅ **Required** Supabase configuration

### New Features

- ✅ `SupabaseConfigError` page - shows setup instructions
- ✅ `supabaseConfigured` flag in authStore
- ✅ Email validation in login/register
- ✅ Better error messages

### File Changes

```
src/store/authStore.ts        # UPDATED - Supabase only
src/App.tsx                   # UPDATED - checks Supabase
src/pages/SupabaseConfigError.tsx  # NEW - setup page
```

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Supabase SQL**: https://supabase.com/docs/guides/database
- **Environment Variables**: https://vitejs.dev/guide/env-and-mode

---

## 🎓 Next Steps

1. ✅ Create Supabase account
2. ✅ Create project
3. ✅ Get credentials
4. ✅ Create `.env.local`
5. ✅ Create database tables
6. ✅ Restart dev server
7. 🎉 **Enjoy MoneyFlow Pro!**

---

## 💬 Need Help?

If you encounter issues:

1. **Check error message** - SupabaseConfigError shows what's missing
2. **Verify credentials** - Double-check `.env.local`
3. **Restart dev server** - `npm run dev`
4. **Check console** - Browser dev tools for detailed errors
5. **Check Supabase logs** - Dashboard → Logs section

---

**MoneyFlow Pro is now production-ready with full Supabase integration!** 🚀
