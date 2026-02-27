# TrackZen - AI-Powered Study Planner & Habit Tracker

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Components](#components)
- [Hooks & Utilities](#hooks--utilities)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Performance Optimizations](#performance-optimizations)

---

## 🎯 Overview

TrackZen is a comprehensive productivity platform that combines AI-assisted study planning, habit tracking, and analytics in one seamless application. Built with modern technologies and best practices, it offers a smooth, performant, and delightful user experience.

### Key Highlights

- ✅ **AI-Powered Planning**: Generate study plans using Groq AI (GPT-OSS-120B, LLaMA models)
- ✅ **Smart Scheduling**: Automatic topic distribution with priority-based algorithms
- ✅ **Habit Tracking**: Daily, weekly, monthly habits with streak gamification
- ✅ **Rich Analytics**: Comprehensive insights with interactive charts
- ✅ **SWR Integration**: Optimized data fetching with caching and revalidation
- ✅ **Responsive Design**: Beautiful UI that works on all devices
- ✅ **Performance Optimized**: Server-side rendering, parallel queries, and optimistic updates

---

## 🌟 Features

### 📚 AI Study Planner

#### Plan Creation
- **AI-Assisted Generation**: Enter exam name (e.g., "GATE CS 2025") and get a complete study plan
- **Manual Creation**: Create custom plans with your own topics
- **Multiple Plan Types**: Exam, Course, Work, Custom
- **Flexible Scheduling**: 
  - Date-bounded mode (fixed exam date)
  - Open-ended mode (daily hours goal)

#### Topic Management
- **Hierarchical Structure**: Topics with nested subtopics
- **Priority Levels**: Highest (1), High (2), Medium (3), Low (4)
- **Status Tracking**: Not Started, In Progress, Completed
- **Smart Scheduling**: Auto-distribute topics based on available time
- **Reschedule Support**: Adjust plans when behind schedule
- **Weak Area Marking**: Flag difficult topics for extra focus

#### Study Tracking
- **Daily Progress Logs**: Track hours spent per topic
- **Completion Percentage**: Visual progress indicators
- **Session Tracking**: Multiple study sessions per day
- **Notes & Reflections**: Add notes to each study session

### 🎯 Habit Tracker

#### Habit Creation
- **Flexible Frequencies**: 
  - Daily: Every day tracking
  - Weekly: Select specific days (e.g., Mon, Wed, Fri)
  - Monthly: Monthly goal tracking
- **Categories**: Health, Mind, Study, Work, Custom
- **Customization**: Choose colors and icons
- **Priority Levels**: 1-5 scale for habit importance
- **Time Slots**: Optional time-of-day scheduling

#### Habit Tracking
- **Three States**: Done, Missed, Skipped
- **Quick Actions**: One-click habit logging
- **Visual Feedback**: Progress rings and completion indicators
- **Streak Building**: Individual streak per habit

#### Habit Analytics
- **Completion Rates**: Daily, weekly, monthly statistics
- **Calendar Heatmap**: Visual representation of habit history
- **Trend Analysis**: Identify patterns and improvements
- **Streak Leaderboard**: Compare habits by streak length

### 🔥 Streak System

#### Global Streak
- **Activity-Based**: Increments with ANY activity (study or habit)
- **Daily Tracking**: Must log something each day
- **Longest Streak**: Tracks personal best

#### Habit Streaks
- **Individual Tracking**: Each habit has its own streak
- **Frequency-Aware**: Adapts to habit frequency (daily/weekly/monthly)
- **Visual Evolution**: Color changes based on streak length

#### Streak Colors & Milestones
```
0 days:      Gray (No Streak)
1-2 days:    Red (Getting Started)
3-6 days:    Orange (On a Roll)
7-13 days:   Gold (One Week Strong)
14-29 days:  Purple (Two Weeks Warrior)
30+ days:    Cyan/Fire (Unstoppable)
```

#### Achievements
- 7-day milestone
- 14-day milestone
- 30-day milestone
- 60-day milestone
- 100-day milestone

### 📊 Rich Analytics

#### Dashboard Overview
- **Quick Stats**: Streak, weekly hours, habits completed, next exam
- **Today's Focus**: Scheduled topics for today
- **Active Plans**: Current plan progress with completion percentage
- **Habit Rings**: Visual completion indicators

#### Study Analytics
- **Hours Analysis**: 
  - Planned vs Actual hours
  - Daily/Weekly/Monthly trends
  - Time distribution across topics
- **Completion Metrics**:
  - Topics completed vs total
  - Progress percentage
  - Pace analysis (ahead/behind schedule)
- **Performance Insights**:
  - Most productive days
  - Average study duration
  - Study consistency

#### Habit Analytics
- **Completion Rates**: Overall and per-habit statistics
- **Streak Leaderboard**: Best performing habits
- **Calendar Heatmap**: Year-long visualization
- **Trend Charts**: Weekly and monthly patterns
- **Category Breakdown**: Performance by habit category

#### Study Tracker Features
- **Mock Test Tracking**:
  - Schedule and log mock tests
  - Section-wise analysis
  - Accuracy and time metrics
  - Performance trends
- **Revision Management**:
  - Three revision stages (First, Second, Third)
  - Spaced repetition scheduling
  - Confidence level tracking
- **Mistake Notebook**:
  - Log mistakes from tests/practice
  - Category-wise organization
  - Review tracking
  - Resolution marking
- **Weekly Reviews**:
  - Planned vs Actual comparison
  - Achievements and reflections
  - Weak area identification
  - Adjustment planning

### ✨ UI/UX Features

- **Dark Theme**: Eye-friendly design optimized for long sessions
- **Smooth Animations**: GSAP + Framer Motion for delightful interactions
- **Responsive Design**: Mobile, tablet, and desktop support
- **Loading States**: Skeleton screens and progressive loading
- **Error Handling**: User-friendly error messages
- **Optimistic Updates**: Instant UI feedback
- **Toast Notifications**: Non-intrusive success/error messages
- **Keyboard Shortcuts**: Quick navigation (coming soon)

---

## 🚀 Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.2.3 | React framework with App Router |
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.4.5 | Type safety |
| **Tailwind CSS** | 3.4.3 | Utility-first styling |
| **shadcn/ui** | Latest | Pre-built component library |
| **Framer Motion** | 11.2.6 | Declarative animations |
| **GSAP** | 3.12.5 | Advanced animations |
| **Lucide React** | 0.379.0 | Icon library |
| **Lottie React** | 2.4.0 | Animated graphics |
| **Recharts** | 2.12.7 | Data visualization |
| **SWR** | 2.4.0 | Data fetching & caching |
| **Zustand** | 4.5.2 | State management |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js API Routes** | 14.2.3 | Serverless API endpoints |
| **NextAuth.js** | 4.24.7 | Authentication |
| **Drizzle ORM** | 0.30.10 | Type-safe database queries |
| **PostgreSQL** | Latest | Primary database |
| **Supabase** | 2.43.4 | Database hosting + real-time |

### AI & External Services

| Service | Purpose |
|---------|---------|
| **Groq API** | AI-powered plan generation |
| **Google OAuth** | User authentication |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Drizzle Kit** | Database migrations |
| **ESLint** | Code linting |
| **Prettier** | Code formatting (via ESLint) |
| **TypeScript** | Type checking |

---

## 🏗️ Project Architecture

### Directory Structure

```
trackzen/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── dashboard/            # Main dashboard page
│   │   │   └── page.tsx
│   │   ├── planner/              # Study planner
│   │   │   ├── page.tsx          # Plans list
│   │   │   ├── new/              # Create new plan
│   │   │   │   └── page.tsx
│   │   │   └── [planId]/         # Individual plan view
│   │   │       └── page.tsx
│   │   ├── habits/               # Habit tracker
│   │   │   └── page.tsx
│   │   ├── analytics/            # Analytics dashboard
│   │   │   └── page.tsx
│   │   ├── study-tracker/        # Advanced study tracking
│   │   └── settings/             # User settings
│   │       └── page.tsx
│   ├── api/                      # API routes (serverless functions)
│   │   ├── auth/                 # Authentication
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── dashboard/            # Dashboard data
│   │   │   └── initial/
│   │   │       └── route.ts
│   │   ├── plans/                # Plan CRUD operations
│   │   │   ├── route.ts          # GET all, POST new
│   │   │   └── [planId]/         # Plan-specific operations
│   │   │       ├── route.ts      # GET, PUT, DELETE plan
│   │   │       └── topics/       # Topic operations
│   │   │           ├── status/   # Update all topic statuses
│   │   │           ├── bulk-schedule/  # Reschedule topics
│   │   │           └── [topicId]/      # Individual topic
│   │   │               └── route.ts
│   │   ├── habits/               # Habit CRUD operations
│   │   │   ├── route.ts          # GET all, POST new
│   │   │   └── log/              # Log habit completion
│   │   │       └── route.ts
│   │   ├── streaks/              # Streak calculation
│   │   │   └── route.ts
│   │   ├── study-logs/           # Daily study logs
│   │   │   └── route.ts
│   │   ├── analytics/            # Analytics endpoints
│   │   │   ├── summary/          # Dashboard summary
│   │   │   │   └── route.ts
│   │   │   └── study-tracker/    # Study tracker analytics
│   │   │       └── route.ts
│   │   ├── ai/                   # AI generation
│   │   │   └── generate-plan/
│   │   │       └── route.ts
│   │   ├── mock-tests/           # Mock test tracking
│   │   │   └── route.ts
│   │   ├── revisions/            # Revision tracking
│   │   │   └── route.ts
│   │   ├── mistakes/             # Mistake notebook
│   │   │   └── route.ts
│   │   └── weekly-reviews/       # Weekly review logs
│   │       └── route.ts
│   ├── login/                    # Login page
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui base components
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── page-transition.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── tooltip.tsx
│   ├── layout/                   # Layout components
│   │   ├── sidebar.tsx           # Navigation sidebar
│   │   └── topbar.tsx            # Top navigation bar
│   ├── planner/                  # Planner-specific components
│   │   └── timeline-calendar.tsx # Calendar view
│   ├── habits/                   # Habit-specific components
│   │   └── habit-dialog.tsx      # Habit create/edit dialog
│   └── providers/                # Context providers
│       ├── session-provider.tsx  # NextAuth session wrapper
│       ├── dashboard-provider.tsx# Dashboard data provider
│       └── swr-provider.tsx      # SWR configuration provider
│
├── lib/                          # Core utilities and logic
│   ├── db/                       # Database layer
│   │   ├── index.ts              # Database client
│   │   └── schema.ts             # Drizzle schema definitions
│   ├── hooks/                    # Custom React hooks
│   │   └── use-swr-api.ts        # SWR-based API hooks
│   ├── ai.ts                     # AI integration (Groq API)
│   ├── api-helpers.ts            # API utility functions
│   ├── auth.ts                   # NextAuth configuration
│   ├── scheduler.ts              # Plan scheduling algorithms
│   ├── streak.ts                 # Streak calculation logic
│   ├── supabase.ts               # Supabase client
│   ├── swr-config.ts             # SWR configuration
│   └── utils.ts                  # General utilities
│
├── types/                        # TypeScript type definitions
│   └── next-auth.d.ts            # NextAuth type extensions
│
├── drizzle/                      # Database migrations
│   ├── 0000_pale_nebula.sql      # Initial schema
│   ├── 0001_add_habit_fields.sql # Habit enhancements
│   ├── 0002_add_study_tracking_features.sql
│   ├── 0003_add_priority_levels.sql
│   ├── 0004_add_performance_indexes.sql
│   └── meta/                     # Migration metadata
│
├── scripts/                      # Utility scripts
│   ├── migrate.js                # Run migrations
│   ├── migrate-indexes.js        # Add indexes
│   ├── migrate-new.js            # New migration helper
│   ├── migrate-priority.js       # Priority migration
│   └── test-ai-generation.js     # Test AI generation
│
├── docs/                         # Documentation
│   ├── API_OPTIMIZATION_REPORT.md
│   ├── PERFORMANCE_OPTIMIZATION.md
│   ├── SWR_IMPLEMENTATION.md
│   ├── STUDY_TRACKER_GUIDE.md
│   └── TESTING_CHECKLIST.md
│
├── public/                       # Static assets
│   └── TrackZenTrans_logo.png   # Logo
│
├── .env.local                    # Environment variables (local)
├── .env.example                  # Environment template
├── drizzle.config.ts             # Drizzle configuration
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.js             # PostCSS configuration
└── package.json                  # Dependencies
```

### Architecture Patterns

#### 1. **App Router (Next.js 14)**
- File-based routing with app directory
- Server Components by default
- Client Components with 'use client' directive
- Nested layouts for shared UI
- Route groups for organization `(dashboard)`

#### 2. **API Layer**
- RESTful API routes in `app/api`
- Serverless functions (auto-deployed on Vercel)
- Authentication with `withAuth` wrapper
- Standardized error responses
- Cache headers for optimization

#### 3. **Data Fetching (SWR)**
- Client-side data fetching with caching
- Automatic revalidation
- Optimistic updates
- Deduplication of requests
- Error retry logic

#### 4. **State Management**
- **SWR Cache**: Server state (API data)
- **React Context**: Dashboard data provider
- **Zustand**: Global client state (if needed)
- **Local State**: Component-level with useState

#### 5. **Database Layer**
- **Drizzle ORM**: Type-safe queries
- **PostgreSQL**: Relational database
- **Migrations**: Version-controlled schema changes
- **Relations**: Foreign keys and cascading deletes

---

## 🗄️ Database Schema

### Core Tables

#### **users**
```typescript
{
  id: uuid (PK)
  email: text (unique, not null)
  name: text (not null)
  avatarUrl: text
  createdAt: timestamp
  settings: jsonb {
    theme?: string
    notifications?: boolean
    timezone?: string
  }
}
```

#### **plans**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  title: text (not null)
  type: enum('exam', 'work', 'course', 'custom')
  startDate: date (not null)
  endDate: date (nullable for open-ended)
  dailyHours: real (for open-ended mode)
  totalEstimatedHours: real
  color: text (hex color)
  isAiGenerated: boolean
  status: enum('active', 'completed', 'paused')
  createdAt: timestamp
}
```

#### **topics**
```typescript
{
  id: uuid (PK)
  planId: uuid (FK -> plans.id, cascade delete)
  parentId: uuid (FK -> topics.id, self-reference)
  title: text (not null)
  estimatedHours: real
  priority: enum('highest', 'high', 'medium', 'low')
  weightage: real (percentage importance)
  scheduledDate: date
  orderIndex: integer
  status: enum('not_started', 'in_progress', 'completed')
  notes: text
  isWeakArea: boolean
}
```

#### **dailyProgress**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  topicId: uuid (FK -> topics.id)
  date: date (not null)
  hoursSpent: real
  completionPct: integer (0-100)
  notes: text
  createdAt: timestamp
}
```

#### **habits**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  title: text (not null)
  description: text
  category: text (Health, Mind, Study, Work, Custom)
  frequency: enum('daily', 'weekly', 'monthly')
  targetDays: integer[] (for weekly: [1,3,5] = Mon,Wed,Fri)
  timeSlot: text (morning, afternoon, evening)
  priority: integer (1-5)
  color: text (hex color)
  icon: text (icon name)
  isActive: boolean
  createdAt: timestamp
}
```

#### **habitLogs**
```typescript
{
  id: uuid (PK)
  habitId: uuid (FK -> habits.id)
  userId: uuid (FK -> users.id)
  date: date (not null)
  status: enum('done', 'missed', 'skipped')
  note: text
}
```

#### **streaks**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  type: enum('global', 'plan', 'habit')
  refId: uuid (habit/plan ID if type-specific)
  currentStreak: integer
  longestStreak: integer
  lastActiveDate: date
  updatedAt: timestamp
}
```

### Study Tracker Tables

#### **dailyStudyLogs**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  planId: uuid (FK -> plans.id)
  date: date (not null)
  plannedHours: real
  actualHours: real
  topicsCompleted: integer
  revisionDone: boolean
  notes: text
  createdAt: timestamp
}
```

#### **mockTests**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  planId: uuid (FK -> plans.id)
  testName: text (not null)
  testDate: date (not null)
  status: enum('scheduled', 'completed', 'analysed')
  totalMarks: integer
  scoredMarks: integer
  accuracy: real
  timeTaken: integer (minutes)
  sections: jsonb[] {
    name: string
    totalQuestions: number
    correctAnswers: number
    wrongAnswers: number
    unattempted: number
    accuracy: number
  }
  analysisNotes: text
  createdAt: timestamp
}
```

#### **revisionTracking**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  topicId: uuid (FK -> topics.id)
  stage: enum('first', 'second', 'third')
  scheduledDate: date (not null)
  completedDate: date
  confidenceLevel: integer (1-5)
  notes: text
  createdAt: timestamp
}
```

#### **mistakeNotebook**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  topicId: uuid (FK -> topics.id)
  mockTestId: uuid (FK -> mockTests.id)
  question: text (not null)
  yourAnswer: text
  correctAnswer: text (not null)
  explanation: text
  category: text (Calculation Error, Concept Unclear, etc.)
  isResolved: boolean
  reviewCount: integer
  lastReviewDate: date
  createdAt: timestamp
}
```

#### **weeklyReviews**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  planId: uuid (FK -> plans.id)
  weekStartDate: date (not null)
  weekEndDate: date (not null)
  plannedHours: real
  actualHours: real
  topicsPlanned: integer
  topicsCompleted: integer
  mockTestsTaken: integer
  averageAccuracy: real
  weakAreas: text[]
  achievements: text[]
  adjustments: text
  reflection: text
  createdAt: timestamp
}
```

### Database Relationships

```
users
  ├─ one-to-many → plans
  ├─ one-to-many → habits
  ├─ one-to-many → streaks
  ├─ one-to-many → dailyProgress
  ├─ one-to-many → habitLogs
  ├─ one-to-many → dailyStudyLogs
  ├─ one-to-many → mockTests
  ├─ one-to-many → revisionTracking
  ├─ one-to-many → mistakeNotebook
  └─ one-to-many → weeklyReviews

plans
  ├─ belongs-to → users
  ├─ one-to-many → topics
  ├─ one-to-many → dailyStudyLogs
  ├─ one-to-many → mockTests
  └─ one-to-many → weeklyReviews

topics
  ├─ belongs-to → plans
  ├─ belongs-to → topics (parent)
  ├─ one-to-many → topics (subtopics)
  ├─ one-to-many → dailyProgress
  ├─ one-to-many → revisionTracking
  └─ one-to-many → mistakeNotebook

habits
  ├─ belongs-to → users
  └─ one-to-many → habitLogs

habitLogs
  ├─ belongs-to → habits
  └─ belongs-to → users

mockTests
  ├─ belongs-to → users
  ├─ belongs-to → plans
  └─ one-to-many → mistakeNotebook
```

### Indexes (Performance)

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);

-- Plan queries
CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_plans_status ON plans(status);

-- Topic queries
CREATE INDEX idx_topics_plan_id ON topics(plan_id);
CREATE INDEX idx_topics_scheduled_date ON topics(scheduled_date);
CREATE INDEX idx_topics_status ON topics(status);

-- Progress tracking
CREATE INDEX idx_daily_progress_user_date ON daily_progress(user_id, date);
CREATE INDEX idx_daily_progress_topic_id ON daily_progress(topic_id);

-- Habit tracking
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, date);
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date);

-- Streak lookups
CREATE INDEX idx_streaks_user_type ON streaks(user_id, type);
```

---

## 🔌 API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://trackzen.vercel.app/api`

### Authentication
All API routes (except `/api/auth/*`) require authentication via NextAuth session cookies.

### Response Format
```typescript
// Success
{
  "data": { ... }
}

// Error
{
  "error": "Error message"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

### Authentication Endpoints

#### **POST** `/api/auth/signin/google`
Initiates Google OAuth flow.

#### **GET** `/api/auth/session`
Returns current user session.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://..."
  },
  "expires": "2024-12-31T23:59:59.000Z"
}
```

---

### Dashboard Endpoints

#### **GET** `/api/dashboard/initial`
Fetch complete dashboard data including user, plans, habits, streaks, and summary.

**Response:**
```json
{
  "user": { "id": "uuid", "name": "John", "email": "john@example.com" },
  "streak": 15,
  "plans": [...],
  "activePlans": [...],
  "habits": [...],
  "todayLogs": {},
  "habitsCompleted": 3,
  "summary": {
    "streak": 15,
    "todayTasks": [...],
    "todayHabits": [...],
    "activePlans": [...],
    "weeklyHours": 25.5,
    "habitsCompleted": 3,
    "nextExamDays": 45
  }
}
```

---

### Plan Endpoints

#### **GET** `/api/plans`
Get all plans for authenticated user.

**Response:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "title": "GATE CS 2025",
      "type": "exam",
      "startDate": "2024-01-01",
      "endDate": "2024-06-01",
      "status": "active",
      "totalTopics": 45,
      "completedTopics": 12
    }
  ]
}
```

#### **POST** `/api/plans`
Create a new plan.

**Request Body:**
```json
{
  "title": "GATE CS 2025",
  "type": "exam",
  "startDate": "2024-01-01",
  "endDate": "2024-06-01",
  "dailyHours": null,
  "color": "#7C3AED",
  "isAiGenerated": false,
  "topics": [
    {
      "title": "Data Structures",
      "estimatedHours": 40,
      "priority": 1,
      "weightage": 15,
      "subtopics": [
        {
          "title": "Arrays and Linked Lists",
          "estimatedHours": 10,
          "priority": 1
        }
      ]
    }
  ]
}
```

#### **GET** `/api/plans/[planId]`
Get specific plan with topics.

#### **PUT** `/api/plans/[planId]`
Update plan details.

#### **DELETE** `/api/plans/[planId]`
Delete plan (cascades to topics and progress).

#### **PUT** `/api/plans/[planId]/topics/[topicId]`
Update topic (status, progress, notes).

**Request Body:**
```json
{
  "status": "completed",
  "hoursSpent": 8.5,
  "notes": "Completed all exercises"
}
```

#### **POST** `/api/plans/[planId]/topics/bulk-schedule`
Reschedule all incomplete topics from today.

---

### Habit Endpoints

#### **GET** `/api/habits`
Get all active habits with today's logs.

**Response:**
```json
{
  "habits": [
    {
      "id": "uuid",
      "title": "Morning Exercise",
      "category": "Health",
      "frequency": "daily",
      "priority": 1,
      "color": "#7C3AED",
      "icon": "activity"
    }
  ],
  "todayLogs": {
    "habit_uuid": {
      "id": "log_uuid",
      "status": "done",
      "note": null
    }
  }
}
```

#### **POST** `/api/habits`
Create new habit.

**Request Body:**
```json
{
  "title": "Morning Exercise",
  "description": "30 minutes cardio",
  "category": "Health",
  "frequency": "daily",
  "targetDays": null,
  "timeSlot": "morning",
  "priority": 1,
  "color": "#7C3AED",
  "icon": "activity"
}
```

#### **POST** `/api/habits/log`
Log habit completion.

**Request Body:**
```json
{
  "habitId": "uuid",
  "date": "2024-01-15",
  "status": "done",
  "note": "Great workout!"
}
```

---

### Streak Endpoints

#### **GET** `/api/streaks`
Get all streaks for user.

**Response:**
```json
{
  "globalStreak": 15,
  "streaks": [
    {
      "id": "uuid",
      "type": "global",
      "currentStreak": 15,
      "longestStreak": 30,
      "lastActiveDate": "2024-01-15"
    },
    {
      "id": "uuid",
      "type": "habit",
      "refId": "habit_uuid",
      "currentStreak": 7,
      "longestStreak": 14
    }
  ]
}
```

---

### Analytics Endpoints

#### **GET** `/api/analytics/summary`
Get dashboard summary data (same as `/api/dashboard/initial` summary).

#### **GET** `/api/analytics/study-tracker?planId=uuid`
Get comprehensive study analytics for a plan.

**Response:**
```json
{
  "plan": {...},
  "totalTopics": 45,
  "completedTopics": 12,
  "weeklyHours": 25.5,
  "dailyLogs": [...],
  "mockTests": [...],
  "upcomingRevisions": [...]
}
```

---

### Study Tracker Endpoints

#### **GET/POST** `/api/study-logs`
Manage daily study logs.

#### **GET/POST** `/api/mock-tests`
Track mock test results.

#### **GET/POST** `/api/revisions`
Schedule and track revisions.

#### **GET/POST** `/api/mistakes`
Maintain mistake notebook.

#### **GET/POST** `/api/weekly-reviews`
Log weekly review reflections.

---

### AI Endpoints

#### **POST** `/api/ai/generate-plan`
Generate study plan using AI.

**Request Body:**
```json
{
  "prompt": "GATE CS 2025 - Complete syllabus"
}
```

**Response:**
```json
{
  "topics": [
    {
      "title": "Data Structures & Algorithms",
      "estimated_hours": 120,
      "priority": 1,
      "weightage": 20,
      "subtopics": [
        {
          "title": "Arrays and Strings",
          "estimated_hours": 15,
          "priority": 1
        }
      ]
    }
  ]
}
```

**AI Models (Groq):**
1. Primary: `openai/gpt-oss-120b`
2. Fallback 1: `llama-3.3-70b-versatile`
3. Fallback 2: `llama-3.1-8b-instant`

---

## 🧩 Components

### UI Components (shadcn/ui)

Located in `components/ui/`, these are customizable, accessible Radix UI primitives:

- **Button**: Multiple variants (default, secondary, outline, ghost, link)
- **Card**: Container with header, content, footer sections
- **Dialog**: Modal dialogs with overlay
- **Input**: Text input with validation states
- **Select**: Dropdown select menu
- **Tabs**: Tabbed navigation
- **Badge**: Status indicators
- **Progress**: Progress bars
- **Avatar**: User avatars with fallback
- **Tooltip**: Hover tooltips
- **Toast**: Toast notifications
- **Dropdown Menu**: Context menus
- **Loading Spinner**: Loading states with skeletons

### Layout Components

#### **Sidebar** (`components/layout/sidebar.tsx`)
```tsx
<Sidebar isOpen={isMobileOpen} onClose={() => setMobileOpen(false)} />
```
- Navigation menu with icons
- Mobile responsive (drawer on mobile)
- Active route highlighting
- Pro tip section

#### **Topbar** (`components/layout/topbar.tsx`)
- User avatar with dropdown
- Notifications (coming soon)
- Quick actions
- Mobile menu toggle

### Feature Components

#### **Timeline Calendar** (`components/planner/timeline-calendar.tsx`)
- Visual topic scheduling
- Drag-and-drop support (future)
- Date navigation
- Topic status indicators

#### **Habit Dialog** (`components/habits/habit-dialog.tsx`)
- Create/edit habit form
- Category selection
- Frequency picker
- Icon and color customization

### Provider Components

#### **Session Provider** (`components/providers/session-provider.tsx`)
```tsx
<SessionProvider session={session}>
  {children}
</SessionProvider>
```
Wraps app with NextAuth session context.

#### **SWR Provider** (`components/providers/swr-provider.tsx`)
```tsx
<SWRProvider>
  {children}
</SWRProvider>
```
Configures SWR with global settings.

#### **Dashboard Provider** (`components/providers/dashboard-provider.tsx`)
```tsx
<DashboardProvider>
  {/* Components can use useDashboard() */}
</DashboardProvider>
```
Provides dashboard data with SWR, manages optimistic updates.

---

## 🔧 Hooks & Utilities

### Custom Hooks (`lib/hooks/use-swr-api.ts`)

All hooks use SWR for caching and revalidation:

#### Dashboard
```typescript
useDashboardData() 
// Returns: { data, error, isLoading, mutate }
```

#### Plans
```typescript
usePlans()
usePlan(planId)
useCreatePlan()
useUpdatePlan(planId)
useDeletePlan(planId)
```

#### Topics
```typescript
useTopics(planId)
useUpdateTopicStatus(planId, topicId)
useBulkScheduleTopics(planId)
```

#### Habits
```typescript
useHabits()
useCreateHabit()
useUpdateHabit(habitId)
useDeleteHabit(habitId)
useLogHabit()
```

#### Analytics
```typescript
useAnalyticsSummary()
useStudyTrackerAnalytics(planId)
```

### Utility Functions

#### API Helpers (`lib/api-helpers.ts`)

```typescript
// Authentication wrapper
withAuth(async (user) => {
  // Your handler code
})

// Standardized errors
ApiErrors.unauthorized()
ApiErrors.notFound('Resource')
ApiErrors.badRequest('Message')
ApiErrors.serverError()

// Cache headers
CacheHeaders.short  // 30s
CacheHeaders.medium // 60s
CacheHeaders.long   // 5min
CacheHeaders.none   // No cache
```

#### Scheduler (`lib/scheduler.ts`)

```typescript
// Schedule topics across date range
schedulePlan(planId, startDate, endDate, dailyHours, topics)

// Reschedule incomplete topics
reschedulePlan(planId)
```

#### Streak Calculations (`lib/streak.ts`)

```typescript
// Calculate global streak
calculateGlobalStreak(userId)

// Calculate habit-specific streak
calculateHabitStreak(habitId, userId)
```

#### AI Generation (`lib/ai.ts`)

```typescript
// Generate plan from prompt
generateAIPlan(prompt)
// Uses Groq API with fallback models
```

#### General Utils (`lib/utils.ts`)

```typescript
// Class name merger (cn)
cn('base-class', conditionalClass && 'applied', 'another-class')
```

---

## 📥 Installation

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **npm/yarn/pnpm**: Package manager
- **PostgreSQL**: Database (or Supabase account)
- **Google OAuth**: Client ID and Secret
- **Groq API**: API key (optional, for AI features)

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/trackzen.git
cd trackzen
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Environment Variables

Create `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/trackzen
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Groq AI (Optional)
GROQ_API_KEY=your_groq_api_key
```

### Step 4: Database Setup

```bash
# Generate Drizzle types
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Configuration

### Next.js Config (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // Google avatars
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

### Tailwind Config (`tailwind.config.ts`)

```typescript
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F0F1A',
        'bg-surface': '#16161F',
        'bg-elevated': '#1D1D28',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A1A1AA',
        'accent-purple': '#7C3AED',
        // ... more colors
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### SWR Config (`lib/swr-config.ts`)

```typescript
export const swrConfig: SWRConfiguration = {
  dedupingInterval: 2000,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  keepPreviousData: true,
  errorRetryCount: 3,
}
```

### Drizzle Config (`drizzle.config.ts`)

```typescript
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

## 🛠️ Development

### Project Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database commands
npm run db:generate   # Generate migrations
npm run db:push       # Push schema directly
npm run db:migrate    # Run migrations
npm run db:studio     # Open Drizzle Studio
```

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make Changes**
   - Edit files in `app/`, `components/`, or `lib/`
   - TypeScript provides type checking
   - Hot reload updates automatically

3. **Test Changes**
   - Manual testing in browser
   - Check console for errors
   - Test different screen sizes

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature
   ```

### Adding New Features

#### 1. Add Database Table

Edit `lib/db/schema.ts`:
```typescript
export const newTable = pgTable('new_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ... fields
})
```

Generate and run migration:
```bash
npm run db:generate
npm run db:push
```

#### 2. Create API Route

Create `app/api/new-resource/route.ts`:
```typescript
import { withAuth, ApiErrors } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  return withAuth(async (user) => {
    // Your logic
    return NextResponse.json({ data })
  })
}
```

#### 3. Create SWR Hook

Add to `lib/hooks/use-swr-api.ts`:
```typescript
export function useNewResource() {
  return useSWR('/api/new-resource', fetcher, apiConfigs.medium)
}
```

#### 4. Create UI Component

Create `components/feature/component.tsx`:
```tsx
'use client'

export function NewComponent() {
  const { data, error, isLoading } = useNewResource()
  // Your component
}
```

#### 5. Add Page Route

Create `app/(dashboard)/new-page/page.tsx`:
```tsx
export default function NewPage() {
  return <NewComponent />
}
```

### Code Style Guidelines

- **TypeScript**: Use explicit types, avoid `any`
- **Components**: Functional components with hooks
- **Naming**: 
  - Files: `kebab-case.tsx`
  - Components: `PascalCase`
  - Functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Imports**: Group by external, internal, relative
- **Comments**: JSDoc for complex functions
- **Async**: Use async/await, not promises

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

TrackZen is optimized for Vercel deployment.

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel auto-detects Next.js

#### Step 3: Configure Environment Variables

Add in Vercel dashboard:

```
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GROQ_API_KEY
```

#### Step 4: Deploy

Click "Deploy" - Vercel will:
- Install dependencies
- Build the application
- Deploy to global CDN
- Provide a production URL

#### Step 5: Update OAuth

Update Google OAuth redirect URIs:
- `https://your-domain.vercel.app/api/auth/callback/google`

### Custom Domain (Optional)

1. Add domain in Vercel dashboard
2. Configure DNS records
3. Update `NEXTAUTH_URL` environment variable
4. Redeploy

### Database Setup (Production)

For Supabase:
1. Create production project
2. Run migrations:
   ```bash
   npm run db:push
   ```
3. Verify tables in Supabase dashboard

### Monitoring

- **Vercel Analytics**: Automatic performance tracking
- **Error Tracking**: Check Vercel logs
- **Database**: Monitor Supabase dashboard

---

## ⚡ Performance Optimizations

### Implemented Optimizations

#### 1. **SWR Data Fetching**
- Client-side caching reduces API calls
- Automatic revalidation keeps data fresh
- Dedupe requests within time window
- Optimistic updates for instant feedback

#### 2. **Database Query Optimization**
```typescript
// ❌ BAD: N+1 queries
for (const plan of plans) {
  const topics = await getTopics(plan.id)
}

// ✅ GOOD: Single query with JOIN
const plansWithTopics = await db
  .select()
  .from(plans)
  .leftJoin(topics, eq(topics.planId, plans.id))
```

#### 3. **Parallel API Calls**
```typescript
// Fetch multiple resources in parallel
const [plans, habits, streaks] = await Promise.all([
  fetchPlans(),
  fetchHabits(),
  fetchStreaks(),
])
```

#### 4. **SQL Aggregates**
```typescript
// Use SQL for counting instead of fetching all rows
db.select({ 
  count: sql<number>`COUNT(*)`,
  sum: sql<number>`SUM(${column})`
})
```

#### 5. **Cache Headers**
```typescript
// API routes return appropriate cache headers
NextResponse.json(data, { 
  headers: CacheHeaders.medium // 60s cache
})
```

#### 6. **Database Indexes**
- Indexes on frequently queried columns
- Composite indexes for common query patterns
- See `drizzle/0004_add_performance_indexes.sql`

#### 7. **Code Splitting**
```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

#### 8. **Image Optimization**
```typescript
// Next.js Image component auto-optimizes
<Image
  src="/logo.png"
  alt="Logo"
  width={140}
  height={32}
  priority // For above-fold images
/>
```

### Performance Metrics

- **Time to Interactive**: < 2s
- **First Contentful Paint**: < 1s
- **API Response Time**: < 200ms (cached), < 500ms (fresh)
- **Bundle Size**: ~150KB gzipped

### Future Optimizations

- [ ] Service Worker for offline support
- [ ] Virtual scrolling for long lists
- [ ] Web Workers for heavy computations
- [ ] CDN for static assets
- [ ] Redis caching layer

---

## 📚 Additional Resources

### Documentation Files

- **SWR Implementation**: `docs/SWR_IMPLEMENTATION.md`
- **Performance Guide**: `docs/PERFORMANCE_OPTIMIZATION.md`
- **Study Tracker**: `docs/STUDY_TRACKER_GUIDE.md`
- **Testing Checklist**: `docs/TESTING_CHECKLIST.md`

### External Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [SWR Documentation](https://swr.vercel.app)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write clear commit messages
5. Test thoroughly
6. Submit a pull request

### Contribution Guidelines

- Follow existing code style
- Write TypeScript with proper types
- Add comments for complex logic
- Update documentation for new features
- Test on multiple screen sizes

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` file for details.

---

## 👨‍💻 Author

Built with ❤️ by **Vaibhav**

For questions or feedback, please open an issue on GitHub.

---

## 🙏 Acknowledgments

- Design inspiration from Notion, Routiner, and modern productivity apps
- Built with amazing open-source tools
- Community feedback and contributions

---

**⭐ Star this repo if you find it helpful!**

