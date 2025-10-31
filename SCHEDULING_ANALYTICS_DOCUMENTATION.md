# Dokumentasi Fitur Scheduling dan Analytics

## 📋 Ringkasan

Telah berhasil mengimplementasikan dua fitur utama:
1. **Scheduling System** - Manajemen jadwal sesi terapi untuk anak
2. **Analytics Dashboard** - Analisis komprehensif perkembangan terapi dan tren aktivitas

---

## 🎯 1. Fitur Scheduling (Manajemen Jadwal)

### Backend Implementation

#### Model Schedule (`model/models.go`)
```go
type Schedule struct {
    ID                uint
    ChildID           uint       // FK ke Child
    ActivityID        *uint      // FK ke Activity (opsional)
    ScheduledDate     time.Time  // Tanggal jadwal
    ScheduledTime     string     // Jam dalam format HH:MM
    DurationMinutes   int        // Durasi default 60 menit
    Notes             string     // Catatan/deskripsi
    RecurrencePattern string     // "none", "daily", "weekly", "monthly"
    RecurrenceEndDate *time.Time // Tanggal akhir pengulangan
    IsCompleted       bool       // Status selesai/belum
    CompletedAt       *time.Time // Waktu penyelesaian
    Reminder          bool       // Aktifkan reminder
    ReminderMinutes   int        // Menit sebelum sesi (default 15)
}
```

#### Database Migration (`db/migration.go`)
- **Migration 006**: Membuat tabel `schedules` dengan indexes optimal:
  - `idx_schedules_child_id` - Query jadwal per anak
  - `idx_schedules_scheduled_date` - Query berdasarkan tanggal
  - `idx_schedules_is_completed` - Filter jadwal selesai/belum

#### ScheduleService (`services/schedule.go`)
Methods tersedia:
- `CreateSchedule()` - Buat jadwal baru
- `GetScheduleByID()` - Ambil jadwal spesifik
- `GetSchedulesByChild()` - Semua jadwal anak
- `GetUpcomingSchedules()` - Jadwal mendatang (N hari)
- `GetTodaySchedules()` - Jadwal hari ini
- `UpdateSchedule()` - Edit jadwal
- `CompleteSchedule()` - Tandai selesai
- `DeleteSchedule()` - Hapus jadwal
- `CreateRecurringSchedules()` - Buat jadwal berulang
- `GetScheduleStats()` - Statistik jadwal (completion rate, dll)

#### App Methods (`app.go`)
Exposed ke frontend via Wails binding:
```go
CreateSchedule(childID, activityID, scheduledDate, scheduledTime, notes, recurrencePattern, recurrenceEndDate, durationMinutes)
GetScheduleByID(scheduleID)
GetSchedulesByChild(childID)
GetUpcomingSchedules(childID, days)
GetTodaySchedules(childID)
UpdateSchedule(scheduleID, ...)
CompleteSchedule(scheduleID)
DeleteSchedule(scheduleID)
CreateRecurringSchedules(...)
GetScheduleStats(childID)
```

### Frontend Implementation

#### ScheduleManager Component (`frontend/src/pages/schedule/ScheduleManager.tsx`)
Fitur:
- 📅 **Pemilihan Anak** - Dropdown untuk memilih anak
- ➕ **Form Buat Jadwal** - Input tanggal, jam, aktivitas, durasi
- 🔄 **Pola Pengulangan** - Support daily, weekly, monthly
- ✏️ **Edit Jadwal** - Ubah jadwal existing
- ✅ **Tandai Selesai** - Mark schedule sebagai completed
- 🗑️ **Hapus Jadwal** - Soft delete
- 📊 **Tampilan Terpisah** - Jadwal mendatang vs jadwal selesai

UI Features:
- Responsive layout (mobile, tablet, desktop)
- Color-coded status (blue untuk upcoming, green untuk completed)
- Real-time validation
- Intuitive icons (Edit, Delete, Check)

---

## 📊 2. Fitur Analytics (Dashboard Analitik)

### Backend Implementation

#### Analytics Methods (`app.go`)

1. **GetSessionStatistics(childID, monthsBack)**
   - Total sesi, sesi selesai, durasi rata-rata
   - Grouping by month: `sessions_by_month`, `duration_by_month`
   - Last session info

2. **GetActivityTrends(childID, monthsBack)**
   - Activity frequency & duration per aktivitas
   - Sorted by most used
   - Average duration per aktivitas

3. **GetProgressMetrics(childID)**
   - Total sessions, goals, rewards
   - Goal completion rate (%)
   - Progress snapshot

4. **GetChildComparisonStats()**
   - Anonymized comparison semua anak
   - Average sessions, goals, rewards
   - Individual child statistics

5. **GetMonthlyReportData(childID, year, month)**
   - Comprehensive monthly report
   - Sessions, activities, goals, rewards per bulan
   - Perfect untuk monthly review

### Frontend Implementation

#### AnalyticsDashboard Component (`frontend/src/pages/analytics/AnalyticsDashboard.tsx`)
Menggunakan **Recharts** untuk visualisasi data

**Features:**
- 🔍 **Child Selection** - Pilih anak untuk analisis
- 📈 **Key Metrics Cards** - Total sesi, tujuan tercapai, rewards, completion rate
- 📊 **Tabs Navigation**:
  - **Sesi Tab**: Tren sesi (line chart), statistik sesi
  - **Aktivitas Tab**: Bar chart aktivitas paling sering, detail per aktivitas
  - **Bulanan Tab**: Monthly report dengan date picker, detail komprehensif
  - **Perbandingan Tab**: Perbandingan antar anak, rata-rata per anak

**Charts Used:**
- LineChart - Tren sesi over time
- BarChart - Aktivitas frequency, perbandingan anak
- PieChart - Distribution (ready untuk future use)
- Radar Chart - Ready untuk future comparison

**Styling:**
- Gradient background (slate-50 to slate-100)
- Card-based layout dengan shadow
- Responsive grid (1 col mobile → 4 cols desktop)
- Color-coded metrics (blue, green, amber, purple)

---

## 🔌 Integration dengan Existing Features

### Events Emitted
Schedule methods emit Wails events untuk real-time updates:
```go
"schedule_created"       // Jadwal baru dibuat
"schedule_updated"       // Jadwal diubah
"schedule_completed"     // Jadwal diselesaikan
"schedule_deleted"       // Jadwal dihapus
"schedules_created_batch" // Multiple jadwal dibuat
```

### Sidebar Integration
Added 2 new menu items:
- 🕐 **Jadwal** - Links ke ScheduleManager
- 📊 **Analytics** - Links ke AnalyticsDashboard

### App Router Update
`App.tsx` diupdate untuk:
- Import kedua component baru
- Add cases di `renderPage()`
- Update `getPageTitle()` untuk page title

---

## 📝 Usage Examples

### Creating a Schedule
```bash
# Frontend call
CreateSchedule(
  childID: 1,
  activityID: 5,
  scheduledDate: 2025-11-15,
  scheduledTime: "10:00",
  notes: "Terapi wicara - fokus pronounsiasi",
  recurrencePattern: "weekly",
  recurrenceEndDate: 2025-12-31,
  durationMinutes: 60
)
```

### Getting Analytics
```bash
# Get 6-month session statistics
GetSessionStatistics(childID: 1, monthsBack: 6)

# Get activity trends
GetActivityTrends(childID: 1, monthsBack: 6)

# Get monthly report for specific month
GetMonthlyReportData(childID: 1, year: 2025, month: 11)
```

---

## 🚀 Next Steps / Recommendations

### Phase 2 Features
1. **Calendar View** - Visual calendar dengan drag-drop scheduling
2. **Notification System** - Push notifications untuk reminder
3. **Export Reports** - PDF/Excel export untuk monthly reports
4. **Goal Tracking** - Link schedules dengan specific goals
5. **Performance Metrics** - Goal achievement rate per aktivitas
6. **Batch Operations** - Multiple schedule management

### Optimizations
- Add caching untuk analytics queries (sering diakses)
- Pagination untuk large dataset schedules
- Search/filter schedules
- Bulk complete/delete operations

### Testing
- Unit tests untuk ScheduleService
- Integration tests untuk analytics queries
- Frontend component tests dengan React Testing Library

---

## 📂 File Structure

```
Backend:
├── model/models.go                 (Schedule model)
├── db/migration.go                 (Migration 006)
├── services/schedule.go            (ScheduleService)
└── app.go                          (Schedule & Analytics methods)

Frontend:
├── src/pages/
│   ├── schedule/
│   │   └── ScheduleManager.tsx      (Schedule management UI)
│   ├── analytics/
│   │   └── AnalyticsDashboard.tsx   (Analytics dashboard UI)
├── src/components/layout/
│   ├── sidebar.tsx                 (Updated with new menu items)
└── src/App.tsx                     (Updated router)
```

---

## ✅ Implementation Checklist

- [x] Schedule model definition
- [x] Database migration
- [x] ScheduleService with full CRUD
- [x] App.go methods (Schedule management)
- [x] Analytics methods (5 types)
- [x] ScheduleManager UI component
- [x] AnalyticsDashboard UI component
- [x] Sidebar integration
- [x] App router integration
- [x] Event emissions for real-time updates

---

## 🔒 Notes

- All database queries use proper indexing untuk performance
- Foreign keys maintained via GORM relationships
- Error handling dengan proper Indonesian messages
- Real-time events emitted untuk frontend listeners
- Responsive design untuk semua screen sizes
- Data validation di both backend dan frontend

---

**Implementation Date**: November 1, 2025
**Status**: ✅ Complete and Ready for Testing
