# Timeline Calendar Feature

## Overview
The Timeline Calendar provides an interactive visual representation of your study plan, distributing topics across available days based on priority, estimated hours, and your exam timeline.

## Features

### 1. **Automatic Topic Distribution**
- Topics are automatically distributed from start date to end date
- Distribution algorithm prioritizes topics: High → Medium → Low
- Skips weekends for better planning
- Balances topics across available days

### 2. **Drag & Drop Support**
- Drag topics between different days
- Visual hover feedback
- Smooth animations
- Instant updates

### 3. **Interactive Editing**
- Click edit icon on any topic to reschedule
- Change scheduled dates via dialog
- Bulk redistribution button
- Real-time updates

### 4. **Visual Indicators**
- **Today**: Purple border and highlight
- **Completed**: Green background
- **In Progress**: Blue background
- **High Priority**: Red badge
- **Medium Priority**: Yellow badge
- **Low Priority**: Green badge  
- **Weekends**: Dimmed appearance
- **Empty Days**: "Drop here" indicator

### 5. **Statistics Dashboard**
- Total Topics
- Scheduled Topics
- Completed Topics
- High Priority Count

### 6. **Month Navigation**
- Previous/Next month buttons
- Current month display
- Smooth transitions

### 7. **Performance Optimized**
- Bulk update API for efficient scheduling
- Memoized calculations
- GPU-accelerated animations
- Custom scrollbar styling
- Lazy rendering

## Usage

### Initial Distribution
When you create a plan or add topics, they are automatically distributed across your timeline based on:
1. Start and end dates
2. Topic priority levels
3. Estimated hours per topic
4. Available days (excluding weekends)

### Rescheduling Topics
**Method 1: Drag & Drop**
1. Hover over a topic
2. Drag it to a new date
3. Drop to reschedule

**Method 2: Edit Dialog**
1. Click the edit icon on a topic
2. Select a new date
3. Click "Save Changes"

**Method 3: Bulk Redistribution**
1. Click "Redistribute All" button
2. Confirm the action
3. All incomplete topics are rescheduled automatically

### Viewing Schedule
- Navigate months using arrow buttons
- Scroll within days to see all topics
- Hover over topics for full title
- View estimated hours per topic

## API Integration

### Endpoints Used
- `GET /api/plans/[planId]` - Fetch plan and topics
- `PATCH /api/plans/[planId]/topics/[topicId]` - Update single topic
- `POST /api/plans/[planId]/topics/bulk-schedule` - Bulk update schedules

### Bulk Schedule Format
```json
{
  "schedules": [
    { "topicId": "uuid-1", "scheduledDate": "2026-02-25" },
    { "topicId": "uuid-2", "scheduledDate": "2026-02-26" }
  ]
}
```

## Distribution Algorithm

```typescript
1. Filter incomplete topics
2. Sort by priority (high → medium → low)
3. Calculate topics per day = remaining topics / available days
4. Distribute sequentially:
   - Skip weekends
   - Assign topic to current date
   - Move to next day after topicsPerDay threshold
5. Bulk update all schedules
```

## Design Patterns

### Colors
- **Purple**: Primary accent, today indicator
- **Green**: Success, low priority, completed
- **Yellow**: Warning, medium priority
- **Red**: High priority, urgent
- **Blue**: In progress, info

### Animations
- **Entry**: Fade in + slide up (duration: 200ms)
- **Hover**: Scale 105% (duration: 150ms)
- **Drag**: Opacity 50%
- **Drop**: Fade in (duration: 300ms)

### Responsive Grid
- 7 columns (weekdays)
- Aspect ratio square
- Min height for empty days
- Auto-scroll for overflow

## Technical Details

### Dependencies
- `framer-motion` - Animations
- `lucide-react` - Icons
- `@/components/ui/*` - UI components
- `cn()` utility - Class merging

### State Management
- `useState` for local state
- `useMemo` for computed values
- `useEffect` for auto-distribution
- Props for data flow

### Performance
- Memoized calculations (`useMemo`)
- Bulk API updates (reduce network calls)
- GPU acceleration (CSS transforms)
- Custom thin scrollbar
- Efficient re-renders

## Future Enhancements
- [ ] Multi-select for batch operations
- [ ] Conflict detection (overloaded days)
- [ ] Time estimation per day
- [ ] Export calendar view
- [ ] Integration with study logs
- [ ] Smart rescheduling (ML-based)
- [ ] Recurring tasks support
- [ ] Calendar sync (Google Calendar)

## Troubleshooting

### Topics not appearing
- Check if topics have been created
- Verify start/end dates are valid
- Run "Redistribute All" to reset

### Drag & drop not working
- Ensure browser supports HTML5 drag API
- Check console for errors
- Refresh the page

### Slow performance
- Reduce number of topics per day
- Clear browser cache
- Check network tab for failed requests

## Best Practices

1. **Set realistic timelines** - Don't overload days
2. **Use priorities wisely** - High = urgent, Low = optional
3. **Regular reviews** - Adjust schedule weekly
4. **Track progress** - Mark topics complete
5. **Buffer time** - Leave some days empty
