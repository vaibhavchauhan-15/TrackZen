# TrackZen - AI-Powered Study Planner & Habit Tracker

TrackZen is an all-in-one productivity platform that combines AI-assisted exam and study planning, time-bounded topic scheduling, open-ended task estimation, daily habit tracking, streak-based motivation, and rich analytics — all wrapped in a smooth, dark-themed, animated interface.

![TrackZen Banner](https://via.placeholder.com/1200x400/0F0F1A/7C3AED?text=TrackZen)

## 🌟 Features

### 📚 AI Study Planner
- **AI-Generated Plans**: Enter your exam name or upload a syllabus, and our AI generates a personalized study plan
- **Smart Scheduling**: Automatically distributes topics across your available time
- **Date-Bounded & Open-Ended**: Choose between fixed exam dates or flexible daily hour goals
- **Reschedule Support**: Life happens - easily reschedule when you fall behind

### 🎯 Habit Tracker
- **Daily, Weekly, Monthly**: Track habits with flexible frequencies
- **Visual Progress**: Heatmaps, dot grids, and completion rings
- **Category Organization**: Health, Mind, Study, Work, and custom categories
- **Streak System**: Gamified streaks with color evolution (red → orange → gold → purple → fire)

### 🔥 Streak System
- **Global Streak**: Track overall activity across study and habits
- **Per-Habit Streaks**: Individual streak tracking for each habit
- **Color Evolution**: Streaks change color as you progress (0 → 100+ days)
- **Milestone Celebrations**: Animated celebrations at 7, 14, 30, 60, 100 days

### 📊 Rich Analytics
- **Study Insights**: Hours studied vs planned, completion rates, pace analysis
- **Habit Analytics**: Completion rates, heatmaps, streak leaderboards
- **Visual Charts**: Line charts, bar charts, area charts, donut charts
- **Trend Analysis**: Weekly/monthly trends and predictions

### ✨ Beautiful UI/UX
- **Dark Theme**: Eye-friendly dark theme with accent colors
- **Smooth Animations**: GSAP + Framer Motion animations
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern Stack**: Built with Next.js 14, React, TypeScript, Tailwind CSS

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 + React | SSR/SSG framework |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first + components |
| **Animations** | GSAP + Framer Motion | Scroll + micro-interactions |
| **Icons** | Lucide React + Lottie | Static + animated icons |
| **Auth** | NextAuth.js + Google OAuth | Secure authentication |
| **Database** | Supabase (PostgreSQL) | Data storage + real-time |
| **ORM** | Drizzle ORM | Type-safe DB queries |
| **Charts** | Recharts | Data visualization |
| **State** | Zustand | Global state management |
| **AI** | Claude API / OpenAI API | Smart plan generation |
| **Deploy** | Vercel | Hosting + edge network |

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database (or Supabase account)
- Google OAuth credentials
- (Optional) Claude API or OpenAI API key for AI features

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/trackzen.git
cd trackzen
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI (Optional)
CLAUDE_API_KEY=your_claude_api_key
# OR
OPENAI_API_KEY=your_openai_api_key
```

### 4. Set up the database
```bash
# Generate Drizzle migrations
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

The app uses the following main tables:

- **users**: User accounts (linked to Google OAuth)
- **plans**: Study/work plans with date ranges
- **topics**: Topics and subtopics within plans
- **daily_progress**: Study session logs
- **habits**: User-defined habits
- **habit_logs**: Daily habit completion logs
- **streaks**: Streak tracking (global, per-plan, per-habit)

## 🎨 Project Structure

```
trackzen/
├── app/                          # Next.js 14 App Router
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/            # Main dashboard
│   │   ├── planner/              # Study planner
│   │   ├── habits/               # Habit tracker
│   │   ├── analytics/            # Analytics hub
│   │   └── settings/             # User settings
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── plans/                # Plan CRUD
│   │   ├── habits/               # Habit CRUD
│   │   ├── streaks/              # Streak calculation
│   │   ├── analytics/            # Analytics data
│   │   └── ai/                   # AI plan generation
│   ├── login/                    # Login page
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Layout components
│   └── providers/                # Context providers
├── lib/
│   ├── db/                       # Database schema & client
│   ├── auth.ts                   # NextAuth config
│   ├── scheduler.ts              # Plan scheduling logic
│   ├── streak.ts                 # Streak calculation
│   └── ai.ts                     # AI integration
└── types/                        # TypeScript types
```

## 🚢 Deployment

### Deploy to Vercel (Recommended)

This project is optimized for deployment on Vercel. For detailed deployment instructions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

**Quick Deploy:**

1. Push your code to GitHub
2. Import your repo in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard (see [DEPLOYMENT.md](./DEPLOYMENT.md) for full list)
4. Deploy!

The app includes:
- ✅ Optimized build configuration
- ✅ vercel.json with environment variable mapping
- ✅ Middleware for protected routes
- ✅ API routes optimized for serverless

**Important:** After deployment, update your `NEXTAUTH_URL` and Google OAuth redirect URIs with your production URL.

For troubleshooting and advanced configuration, refer to [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📖 Usage Guide

### Creating a Study Plan

1. **Navigate to Planner** → Click "New Plan"
2. **Choose Creation Mode**:
   - **AI-Assisted**: Enter exam name (e.g., "GATE CS 2026") and let AI generate topics
   - **Manual**: Create topics yourself with custom hours and priorities
3. **Set Schedule**: Choose date-bounded (exam date) or open-ended (daily hours)
4. **Review & Confirm**: Edit AI suggestions or add more topics
5. **Track Progress**: Log study hours daily and watch your progress

### Creating Habits

1. **Navigate to Habits** → Click "New Habit"
2. **Define Habit**: Name, category (Health, Mind, Study, Work, Custom)
3. **Set Frequency**: Daily, Weekly (select days), or Monthly
4. **Customize**: Choose color and icon
5. **Track Daily**: Mark habits as done/missed/skipped each day

### Understanding Streaks

- **Global Streak**: Increments when you log ANY activity (study OR habit)
- **Habit Streak**: Per-habit streak (increments only when that habit is done)
- **Colors**: 
  - 0 days: Gray
  - 1-2: Red (Getting Started)
  - 3-6: Orange (On a Roll)
  - 7-13: Gold (One Week Strong)
  - 14-29: Purple (Two Weeks Warrior)
  - 30+: Cyan/Fire (Unstoppable/Legend)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Design inspiration from Routiner, Everyday, HabitKit, Notion, and various productivity apps
- Built with amazing open-source tools: Next.js, React, Tailwind CSS, Supabase, Drizzle ORM
- UI components from [shadcn/ui](https://ui.shadcn.com/)

## 📧 Contact

For questions or feedback, please open an issue or reach out at [your-email@example.com](mailto:your-email@example.com).

---

**Built with ❤️ by [Your Name](https://github.com/yourusername)**

⭐ Star this repo if you find it helpful!
