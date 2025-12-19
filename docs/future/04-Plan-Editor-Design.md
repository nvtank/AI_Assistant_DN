# Travel Plan Editor Design - GrabTheBeyond

**Mục đích:** Thiết kế tính năng chỉnh sửa bản kế hoạch trực tiếp trên UI

---

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [UI/UX Design](#uiux-design)
3. [Technical Implementation](#technical-implementation)
4. [Validation & Conflict Detection](#validation--conflict-detection)
5. [Data Flow](#data-flow)

---

## 🎯 Tổng Quan

### Tính Năng

Người dùng có thể chỉnh sửa kế hoạch du lịch trực tiếp trên giao diện mà không cần tạo lại từ đầu:

- ✅ **Drag & Drop**: Sắp xếp lại thứ tự activities
- ✅ **Edit Inline**: Chỉnh sửa thời gian, địa điểm, chi phí
- ✅ **Add/Remove**: Thêm hoặc xóa activities
- ✅ **Real-time Validation**: Kiểm tra conflicts ngay lập tức
- ✅ **Auto-adjust**: Tự động điều chỉnh thời gian và chi phí
- ✅ **Undo/Redo**: Hoàn tác các thay đổi

### Use Cases

1. **User không hài lòng với một activity**: Xóa và thay thế
2. **Muốn thêm activity mới**: Thêm vào giữa hoặc cuối ngày
3. **Muốn thay đổi thời gian**: Kéo thả để sắp xếp lại
4. **Muốn điều chỉnh ngân sách**: Thay đổi địa điểm hoặc activity

---

## 🎨 UI/UX Design

### Main Editor Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Travel Plan Editor                                    [Save] [Cancel]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Trip: Da Nang Adventure - 4 Days                                       │
│  Budget: 7,000,000 - 10,000,000 VND                                    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📅 Day 1 - June 15, 2025                          [Collapse] ▼ │  │
│  │  ☀️ Sunny 28-32°C                                                 │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ 🕐 08:00  Breakfast at Madame Lan            [✏️] [🗑️] [↕️]│ │  │
│  │  │     ⏱️ 60 min  💰 150,000 VND                              │ │  │
│  │  │     📍 4 Bạch Đằng, Hải Châu                               │ │  │
│  │  │     [View on Map] [Book Grab]                              │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ 🕐 10:00  Marble Mountains                  [✏️] [🗑️] [↕️]│ │  │
│  │  │     ⏱️ 180 min  💰 40,000 VND                             │ │  │
│  │  │     📍 Ngũ Hành Sơn District                               │ │  │
│  │  │     [View on Map] [Book Grab]                              │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  │  [+ Add Activity]                                                 │  │
│  │                                                                   │  │
│  │  Total Day 1: 1,245,000 VND                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📅 Day 2 - June 16, 2025                          [Collapse] ▼ │  │
│  │  ...                                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Trip Summary                                                     │  │
│  │  Accommodation: 3,600,000 VND                                    │  │
│  │  Food: 2,400,000 VND                                              │  │
│  │  Transportation: 850,000 VND                                      │  │
│  │  Activities: 1,200,000 VND                                        │  │
│  │  ──────────────────────────────────────────────────────────────── │  │
│  │  Total: 8,050,000 VND (within budget ✓)                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Regenerate with AI] [Export PDF] [Share Plan]                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Edit Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Edit Activity                                    [Save] [Cancel]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Activity Name:                                                  │
│  [Breakfast at Madame Lan                    ]                  │
│                                                                  │
│  Time:                                                           │
│  [08:00]  Duration: [60] minutes                                │
│                                                                  │
│  Location:                                                       │
│  [Search places...                    ] [📍 Use Current]       │
│  Selected: 4 Bạch Đằng, Hải Châu                                │
│                                                                  │
│  Estimated Cost:                                                 │
│  [150,000] VND                                                   │
│                                                                  │
│  Notes:                                                          │
│  [Add notes about this activity...              ]                │
│                                                                  │
│  ⚠️ Warning: This change may affect travel time and costs       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Add Activity Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Add Activity                                    [Add] [Cancel] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Insert After:                                                   │
│  [Select activity... ▼]                                          │
│                                                                  │
│  Activity Type:                                                  │
│  ( ) Restaurant  ( ) Attraction  ( ) Activity  ( ) Other        │
│                                                                  │
│  Search Place:                                                   │
│  [Search places...                    ]                          │
│                                                                  │
│  Or Create Custom:                                                │
│  Name: [                                    ]                    │
│  Location: [Search or enter address...      ]                    │
│                                                                  │
│  Time:                                                           │
│  [Auto-suggest based on previous activity]                       │
│  [10:30]  Duration: [90] minutes                                 │
│                                                                  │
│  Estimated Cost:                                                 │
│  [200,000] VND                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Component Structure

```typescript
// components/travel-plan/PlanEditor.tsx
interface PlanEditorProps {
  plan: TravelPlan;
  onSave: (updatedPlan: TravelPlan) => Promise<void>;
  onCancel: () => void;
}

export default function PlanEditor({ plan, onSave, onCancel }: PlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState<TravelPlan>(plan);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  
  // Drag and drop
  const { dragOverlay, sensors } = useDndContext();
  
  // Validation
  const validatePlan = useCallback((plan: TravelPlan) => {
    // Check for conflicts, budget, etc.
  }, []);
  
  // Auto-adjust
  const autoAdjustTimes = useCallback((day: DayPlan) => {
    // Recalculate times based on travel time
  }, []);
  
  return (
    <div className="plan-editor">
      {/* Editor UI */}
    </div>
  );
}
```

### Drag & Drop Implementation

```typescript
// Using @dnd-kit/core
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

function DayPlanEditor({ day, onUpdate }: DayPlanEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = day.schedule.findIndex(item => item.id === active.id);
      const newIndex = day.schedule.findIndex(item => item.id === over.id);

      const newSchedule = arrayMove(day.schedule, oldIndex, newIndex);
      
      // Auto-adjust times
      const adjustedSchedule = autoAdjustTimes(newSchedule);
      
      onUpdate({
        ...day,
        schedule: adjustedSchedule
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={day.schedule.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {day.schedule.map(activity => (
          <SortableActivityItem
            key={activity.id}
            activity={activity}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Inline Editing

```typescript
// components/travel-plan/EditableTime.tsx
function EditableTime({ 
  time, 
  onChange 
}: { 
  time: string; 
  onChange: (newTime: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(time);

  const handleSave = () => {
    // Validate time format
    if (isValidTime(value)) {
      onChange(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="time"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setIsEditing(false);
        }}
        autoFocus
      />
    );
  }

  return (
    <span onClick={() => setIsEditing(true)} className="editable">
      {time}
    </span>
  );
}
```

### Auto-Adjust Algorithm

```typescript
function autoAdjustTimes(schedule: ActivitySchedule[]): ActivitySchedule[] {
  const adjusted = [...schedule];
  
  for (let i = 1; i < adjusted.length; i++) {
    const previous = adjusted[i - 1];
    const current = adjusted[i];
    
    // Calculate end time of previous activity
    const previousEnd = addMinutes(
      parseTime(previous.time),
      previous.duration
    );
    
    // Calculate travel time
    const travelTime = calculateTravelTime(
      previous.activity.location,
      current.activity.location
    );
    
    // Set new start time
    const newStartTime = addMinutes(previousEnd, travelTime);
    
    adjusted[i] = {
      ...current,
      time: formatTime(newStartTime),
      travelTime,
      transportCost: calculateGrabCost(
        previous.activity.location,
        current.activity.location
      )
    };
  }
  
  return adjusted;
}
```

---

## ✅ Validation & Conflict Detection

### Conflict Types

```typescript
interface Conflict {
  type: 'time_overlap' | 'budget_exceeded' | 'travel_impossible' | 'location_closed';
  severity: 'error' | 'warning';
  message: string;
  activities: string[]; // IDs of conflicting activities
}

function detectConflicts(plan: TravelPlan): Conflict[] {
  const conflicts: Conflict[] = [];
  
  plan.days.forEach(day => {
    // Check time overlaps
    for (let i = 0; i < day.schedule.length - 1; i++) {
      const current = day.schedule[i];
      const next = day.schedule[i + 1];
      
      const currentEnd = addMinutes(
        parseTime(current.time),
        current.duration
      );
      const nextStart = parseTime(next.time);
      
      if (currentEnd > nextStart) {
        conflicts.push({
          type: 'time_overlap',
          severity: 'error',
          message: `Activity "${current.activity.name}" overlaps with "${next.activity.name}"`,
          activities: [current.id, next.id]
        });
      }
    }
    
    // Check budget
    const dayCost = calculateDayCost(day);
    const budgetPerDay = plan.totalEstimatedCost.total / plan.days.length;
    
    if (dayCost > budgetPerDay * 1.2) {
      conflicts.push({
        type: 'budget_exceeded',
        severity: 'warning',
        message: `Day ${day.day} exceeds daily budget by ${((dayCost / budgetPerDay - 1) * 100).toFixed(0)}%`,
        activities: day.schedule.map(a => a.id)
      });
    }
    
    // Check travel feasibility
    day.schedule.forEach((activity, index) => {
      if (index > 0) {
        const previous = day.schedule[index - 1];
        const travelTime = calculateTravelTime(
          previous.activity.location,
          activity.activity.location
        );
        
        if (travelTime > 120) { // More than 2 hours
          conflicts.push({
            type: 'travel_impossible',
            severity: 'warning',
            message: `Travel from "${previous.activity.name}" to "${activity.activity.name}" takes ${travelTime} minutes`,
            activities: [previous.id, activity.id]
          });
        }
      }
    });
  });
  
  return conflicts;
}
```

### Real-Time Validation

```typescript
function usePlanValidation(plan: TravelPlan) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  
  useEffect(() => {
    // Debounce validation
    const timeoutId = setTimeout(() => {
      const detected = detectConflicts(plan);
      setConflicts(detected);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [plan]);
  
  return conflicts;
}
```

---

## 🔄 Data Flow

### Save Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAVE FLOW                                      │
│                                                                  │
│  User clicks "Save"                                             │
│         │                                                        │
│         ▼                                                        │
│  Validate plan                                                  │
│         │                                                        │
│         ├─→ Has errors → Show errors, prevent save              │
│         │                                                        │
│         └─→ Valid                                                │
│                  │                                               │
│                  ▼                                               │
│         Recalculate costs & times                                │
│                  │                                               │
│                  ▼                                               │
│         Optimistic update (UI)                                   │
│                  │                                               │
│                  ▼                                               │
│         Save to Firestore                                        │
│                  │                                               │
│                  ├─→ Success → Show success message             │
│                  │                                               │
│                  └─→ Error → Revert UI, show error              │
└─────────────────────────────────────────────────────────────────┘
```

### Optimistic Updates

```typescript
function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const update = async (newData: T) => {
    // Optimistic update
    setData(newData);
    setIsSaving(true);
    setError(null);
    
    try {
      const saved = await updateFn(newData);
      setData(saved);
    } catch (err) {
      // Revert on error
      setData(initialData);
      setError(err as Error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return { data, update, isSaving, error };
}
```

---

## 🎯 Features Breakdown

### 1. Drag & Drop Reordering

- **Library**: @dnd-kit/core
- **Features**: 
  - Visual feedback during drag
  - Auto-adjust times after reorder
  - Recalculate travel costs

### 2. Inline Editing

- **Time**: Click to edit, time picker
- **Location**: Search và select from Google Places
- **Cost**: Direct input với validation
- **Notes**: Multi-line text input

### 3. Add/Remove Activities

- **Add**: Modal với place search
- **Remove**: Confirmation dialog
- **Auto-adjust**: Times và costs after add/remove

### 4. Real-Time Validation

- **Time conflicts**: Highlight overlapping activities
- **Budget warnings**: Show when exceeding budget
- **Travel feasibility**: Warn about long travel times

### 5. Undo/Redo

- **History stack**: Store previous states
- **Keyboard shortcuts**: Ctrl+Z, Ctrl+Y
- **Visual indicator**: Show if changes can be undone

---

## 📱 Mobile Responsive

### Mobile Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]  Edit Plan                              [Save]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Day 1 - June 15, 2025                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🕐 08:00  Breakfast at Madame Lan         [✏️] [🗑️]     │  │
│  │     ⏱️ 60 min  💰 150,000                                │  │
│  │     📍 4 Bạch Đằng                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Swipe to reorder]                                             │
│                                                                  │
│  [+ Add Activity]                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Touch Interactions

- **Long press**: Start drag
- **Swipe left**: Delete (with confirmation)
- **Tap**: Edit inline
- **Pinch**: Zoom timeline view

---

## 🚀 Performance Optimization

### Virtualization

```typescript
// Use react-window for long lists
import { FixedSizeList } from 'react-window';

function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={activities.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ActivityItem activity={activities[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Memoization

```typescript
const ActivityItem = React.memo(({ activity, onEdit, onDelete }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.activity.id === nextProps.activity.id &&
         prevProps.activity === nextProps.activity;
});
```

---

**Cập nhật lần cuối:** December 2025




