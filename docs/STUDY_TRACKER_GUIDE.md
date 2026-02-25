# 🎯 TrackZen Study Tracker - Complete Feature Guide

## Overview
TrackZen now includes a comprehensive exam preparation tracking system based on proven study strategies. This system helps you track your progress, maintain consistency, and achieve your exam goals through data-driven insights.

---

## 🚀 New Features

### 1. **Timeline Calculator** 
Automatically calculates your daily study targets based on:
- Total days remaining until exam
- Total topics/subtopics to cover
- Current progress
- Buffer days (10% of timeline)

**Formula:**
```
Daily Target = Remaining Topics / Days Available
Buffer Days = Total Days × 10%
```

---

### 2. **Priority-Based Topic Management**

Topics are categorized into three priority levels:

| Priority | Meaning | Timeline |
|----------|---------|----------|
| 🔴 **High** | High weightage + Weak areas | First 50% time |
| 🟡 **Medium** | Important but manageable | Middle phase |
| 🟢 **Low** | Less weightage | Final phase |

**Implementation:**
- Set priority when creating topics
- Mark weak areas with `isWeakArea` flag
- Track completion percentage for each priority level

---

### 3. **Daily Study Logs**

Track three essential metrics daily:
- ✅ **Planned Hours** vs **Actual Hours**
- 📚 **Topics Completed**
- 🔄 **Revision Done**

**API Endpoints:**
- `GET /api/study-logs?planId={id}&startDate={date}&endDate={date}`
- `POST /api/study-logs` - Create new log
- `PUT /api/study-logs` - Update existing log

**Example:**
```json
{
  "planId": "uuid",
  "date": "2026-02-25",
  "plannedHours": 6,
  "actualHours": 5.5,
  "topicsCompleted": 2,
  "revisionDone": true,
  "notes": "Completed ratio and proportion"
}
```

---

### 4. **Mock Test Tracking & Analysis**

Complete mock test management system:
- Schedule upcoming tests
- Record scores and accuracy
- Section-wise analysis
- Track improvement over time

**Test Frequency Guide:**
- Early phase: 1 per week
- Mid phase: 2 per week
- Final 30 days: 3-4 per week

**API Endpoints:**
- `GET /api/mock-tests?planId={id}&status={status}`
- `POST /api/mock-tests` - Schedule/record test
- `PUT /api/mock-tests` - Update test results

**Example:**
```json
{
  "planId": "uuid",
  "testName": "SSC CGL Mock Test 1",
  "testDate": "2026-02-25",
  "status": "completed",
  "totalMarks": 200,
  "scoredMarks": 156,
  "accuracy": 78,
  "sections": [
    {
      "name": "Quantitative Aptitude",
      "totalQuestions": 25,
      "correctAnswers": 20,
      "wrongAnswers": 3,
      "unattempted": 2,
      "accuracy": 80
    }
  ]
}
```

---

### 5. **3-Stage Revision System**

Implements the scientifically proven spaced repetition method:

1. **First Revision:** Within 24 hours
2. **Second Revision:** After 7 days
3. **Third Revision:** After 30 days

**How it works:**
- When you mark a topic as complete, the system automatically schedules all 3 revisions
- Get notifications for due revisions
- Track confidence level (1-5) for each revision

**API Endpoints:**
- `GET /api/revisions?topicId={id}&dueOnly=true`
- `POST /api/revisions` - Auto-create revision schedule
- `PUT /api/revisions` - Mark revision complete

---

### 6. **Mistake Notebook**

Systematically track and resolve mistakes:
- Link mistakes to topics or mock tests
- Categorize by error type:
  - Calculation Error
  - Concept Unclear
  - Time Pressure
  - Careless Mistake
- Track review count
- Mark as resolved when mastered

**API Endpoints:**
- `GET /api/mistakes?unresolvedOnly=true`
- `POST /api/mistakes` - Add new mistake
- `PUT /api/mistakes` - Update/resolve mistake
- `DELETE /api/mistakes?id={id}`

---

### 7. **Weekly Review System**

Every Sunday, generate automated weekly reviews:
- **Planned vs Actual Hours**
- **Topics Planned vs Completed**
- **Mock Tests Taken**
- **Average Accuracy**
- **Weak Areas Identified**
- **Achievements**
- **Adjustments for Next Week**

**API Endpoints:**
- `GET /api/weekly-reviews?planId={id}`
- `POST /api/weekly-reviews` - Auto-calculates from logs
- `PUT /api/weekly-reviews` - Add reflections

---

### 8. **Comprehensive Analytics Dashboard**

Real-time visual dashboard showing:

#### Timeline Metrics
- Days remaining
- Progress percentage
- On-track status
- Buffer days
- Daily target

#### Priority Breakdown
- High/Medium/Low completion rates
- Overdue topics alert
- Priority-wise progress bars

#### Study Hours Analysis
- Last 30 days summary
- Planned vs actual adherence
- Average daily hours
- Consistency tracking

#### Mock Test Performance
- Average score trend
- Section-wise strengths/weaknesses
- Test frequency tracking

#### Revision Status
- Pending revisions
- Overdue alerts
- Stage-wise completion

#### Mistake Analytics
- Total mistakes
- Unresolved count
- Category-wise breakdown

**API Endpoint:**
- `GET /api/analytics/study-tracker?planId={id}`

---

## 📊 Database Schema

### New Tables Added:

1. **daily_study_logs** - Daily study tracking
2. **mock_tests** - Mock test records
3. **revision_tracking** - 3-stage revision system
4. **mistake_notebook** - Mistake management
5. **weekly_reviews** - Weekly review data

### Updated Tables:

**topics table:**
- Changed `priority` from integer to enum: `high`, `medium`, `low`
- Added `is_weak_area` boolean flag

---

## 🎯 Usage Guide

### Step 1: Set Up Your Plan
```typescript
// Create plan with exam date
{
  title: "SSC CGL 2026",
  type: "exam",
  startDate: "2026-02-25",
  endDate: "2026-03-26", // 30 days
  totalEstimatedHours: 180
}
```

### Step 2: Add Topics with Priorities
```typescript
// High priority topics (weak areas, high weightage)
{
  title: "Ratio & Proportion",
  priority: "high",
  isWeakArea: true,
  weightage: 15,
  estimatedHours: 8
}
```

### Step 3: Log Daily Progress
```typescript
// Every day
{
  date: "2026-02-25",
  plannedHours: 6,
  actualHours: 5.5,
  topicsCompleted: 2,
  revisionDone: true
}
```

### Step 4: Schedule Mock Tests
```typescript
// Based on phase
{
  testName: "Full Mock Test 1",
  testDate: "2026-02-28",
  status: "scheduled"
}
```

### Step 5: Review Weekly
Every Sunday, system auto-generates stats. Add your reflections:
```typescript
{
  weakAreas: ["Speed Math", "Data Interpretation"],
  achievements: ["Completed all high priority topics"],
  adjustments: "Need to increase mock test frequency"
}
```

---

## 🔥 Best Practices

1. **Never skip daily logging** - Consistency > Motivation
2. **Complete high priority first** - 50% timeline for high priority
3. **Analyse every mock test** - Analysis > Score
4. **Maintain buffer days** - Keep 10-15 days buffer
5. **Review mistakes regularly** - Weekly mistake review
6. **Track revision schedule** - Never miss scheduled revisions

---

## 🛠️ Migration

Run the migration to add new features:

```bash
npm run db:migrate
```

This will:
- Create new tables
- Add new enums
- Update topics table
- Create necessary indexes

---

## 📱 UI Components

### Study Tracker Dashboard
```
/study-tracker?planId={id}
```
Main analytics dashboard with all metrics

### Individual Pages
- `/study-logs` - Daily logging
- `/mock-tests` - Test management
- `/revisions` - Revision tracking
- `/mistakes` - Mistake notebook
- `/weekly-review` - Weekly reflections

---

## 🎓 For SSC CGL / Competitive Exams

This system is especially designed for competitive exams like:
- SSC CGL
- GATE
- UPSC Prelims
- Bank PO
- Railway Exams
- Any deadline-based learning

**Key Metrics Tracked:**
- Syllabus completion percentage
- Daily consistency
- Mock test progression
- Weak area improvement
- Revision adherence

---

## 💡 Pro Tips

1. **Set realistic daily targets** - Don't overcommit
2. **Track time accurately** - Be honest with actual hours
3. **Categorize mistakes immediately** - During mock test analysis
4. **Use buffer wisely** - For unexpected events, not procrastination
5. **Adjust weekly** - Course correct based on weekly review

---

## 🚧 Future Enhancements

Potential additions:
- [ ] AI-powered study plan adjustments
- [ ] Pomodoro timer integration
- [ ] Study partner collaboration
- [ ] Question bank integration
- [ ] Video progress tracking
- [ ] Mobile app with notifications
- [ ] Export analytics to PDF

---

## 📞 Support

For questions or issues:
1. Check this documentation
2. Review API examples
3. Check console for errors
4. Verify migration ran successfully

---

## 🎯 Success Formula

```
Consistency > Motivation
Tracking > Guesswork
Revision > New Study
Mock Analysis > Mock Score
```

**Remember:** This system works only if you use it daily. Make logging your progress a non-negotiable habit!

---

## License

MIT - Built with ❤️ for exam success
