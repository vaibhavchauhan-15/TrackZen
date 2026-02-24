# 🚀 TrackZen - Quick Start Guide

## Get Up and Running in 5 Minutes!

### Step 1: Install Dependencies (1 min)
```bash
cd TrackZen
npm install
```

### Step 2: Set Up Environment (2 min)
1. Copy the example environment file:
```bash
copy .env.example .env
```

2. Open `.env` and fill in **minimum required** values:

```env
# For Local Development - Minimum Setup
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trackzen
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run_this_command: openssl rand -base64 32
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

> 💡 **Quick Note**: For full production setup, see [SETUP.md](SETUP.md)

### Step 3: Get Google OAuth Credentials (2 min)
1. Go to https://console.cloud.google.com/
2. Create a project or select existing
3. Enable "Google+ API"
4. Create OAuth 2.0 Client:
   - Type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env`

### Step 4: Set Up Database
**Option A: Use Supabase (Recommended)** ✨
1. Create free account at https://supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Copy to `DATABASE_URL` in `.env`
5. Run: `npm run db:push`

**Option B: Use Local PostgreSQL**
1. Install PostgreSQL locally
2. Create database: `createdb trackzen`
3. Update `DATABASE_URL` in `.env`
4. Run: `npm run db:push`

### Step 5: Run the App! 🎉
```bash
npm run dev
```

Open http://localhost:3000

---

## Your First Steps in TrackZen

### 1. Sign In
- Click "Sign in with Google"
- Authorize the app

### 2. Create Your First Study Plan
- Go to **Planner** → Click **"New Plan"**
- Try AI-Assisted:
  - Enter: "Learn React in 30 days"
  - Click "Generate Smart Plan"
  - Review and edit AI suggestions
- OR create manually

### 3. Create Your First Habit
- Go to **Habits** → Click **"New Habit"**
- Example: "Read 10 pages daily"
- Set frequency: Daily
- Choose category: Mind

### 4. Track Your Progress
- Mark habits as done ✅
- Log study hours
- Watch your streak grow! 🔥

---

## Project Structure

```
TrackZen/
├── app/                    # Next.js 14 App Router
│   ├── (dashboard)/        # Protected dashboard pages
│   ├── api/                # API routes
│   ├── login/              # Login page
│   └── page.tsx            # Landing page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Sidebar, topbar
│   └── providers/          # Session provider
├── lib/                    # Core logic
│   ├── db/                 # Database schema
│   ├── auth.ts             # NextAuth config
│   ├── scheduler.ts        # Plan scheduling
│   ├── streak.ts           # Streak calculation
│   └── ai.ts               # AI integration
├── .env                    # Your secrets (DO NOT COMMIT!)
├── package.json            # Dependencies
└── README.md               # Full documentation
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:push          # Push schema to database
npm run db:generate      # Generate migrations
npm run db:studio        # Open database GUI

# Production
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Lint code
```

---

## Optional: Enable AI Features

TrackZen works perfectly without AI, but for the **AI plan generator**:

### Option 1: Claude API (Recommended)
1. Sign up at https://anthropic.com
2. Get API key
3. Add to `.env`: `CLAUDE_API_KEY=sk-ant-xxx`

### Option 2: OpenAI API
1. Sign up at https://openai.com
2. Get API key
3. Add to `.env`: `OPENAI_API_KEY=sk-xxx`

Then restart your dev server!

---

## 🎯 Key Features to Try

✅ **Dashboard** - See your progress at a glance
✅ **Study Planner** - AI or manual plan creation
✅ **Habit Tracker** - Build consistent routines
✅ **Streak System** - Gamified motivation
✅ **Analytics** - Track your productivity trends

---

## Need Help?

- 📖 **Full Setup**: See [SETUP.md](SETUP.md)
- 🚀 **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- 📋 **Project Info**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- 📚 **PRD**: See [PRD/](PRD/) folder

---

## 🐛 Quick Troubleshooting

**Database Error?**
- Make sure `DATABASE_URL` is correct
- Run `npm run db:push` again

**Google Login Not Working?**
- Check redirect URI matches exactly
- Verify Google+ API is enabled

**Port Already in Use?**
```bash
# Use different port
npm run dev -- -p 3001
```

---

## 🌟 You're All Set!

TrackZen is now running locally. Start planning, tracking, and achieving your goals! 

**Happy tracking! 🎉**

---

**Need to deploy?** → See [DEPLOYMENT.md](DEPLOYMENT.md)
**Want AI features?** → Add API key to `.env` (see above)
**Found a bug?** → Open an issue on GitHub
