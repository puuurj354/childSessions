package services

import (
	"childSessions/model"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type ScheduleService struct {
	db *gorm.DB
}

func NewScheduleService(db *gorm.DB) *ScheduleService {
	return &ScheduleService{db: db}
}

// CreateSchedule creates a new schedule
func (s *ScheduleService) CreateSchedule(childID uint, activityID *uint, scheduledDate time.Time, scheduledTime, notes string, recurrencePattern string, recurrenceEndDate *time.Time, durationMinutes int) (*model.Schedule, error) {
	if childID == 0 {
		return nil, fmt.Errorf("ID anak harus diisi")
	}

	schedule := &model.Schedule{
		ChildID:           childID,
		ActivityID:        activityID,
		ScheduledDate:     scheduledDate,
		ScheduledTime:     scheduledTime,
		Notes:             notes,
		RecurrencePattern: recurrencePattern,
		RecurrenceEndDate: recurrenceEndDate,
		DurationMinutes:   durationMinutes,
		Reminder:          true,
		ReminderMinutes:   15,
	}

	if err := s.db.Create(schedule).Error; err != nil {
		return nil, fmt.Errorf("gagal membuat jadwal: %w", err)
	}

	// Load relationships
	if err := s.db.Preload("Child").Preload("Activity").First(schedule, schedule.ID).Error; err != nil {
		return nil, fmt.Errorf("gagal memuat data jadwal: %w", err)
	}

	return schedule, nil
}

// GetScheduleByID retrieves a specific schedule by ID
func (s *ScheduleService) GetScheduleByID(scheduleID uint) (*model.Schedule, error) {
	var schedule model.Schedule
	if err := s.db.Preload("Child").Preload("Activity").First(&schedule, scheduleID).Error; err != nil {
		return nil, fmt.Errorf("jadwal tidak ditemukan: %w", err)
	}
	return &schedule, nil
}

// GetSchedulesByChild retrieves all schedules for a specific child
func (s *ScheduleService) GetSchedulesByChild(childID uint) ([]model.Schedule, error) {
	var schedules []model.Schedule
	if err := s.db.Preload("Activity").Where("child_id = ?", childID).Order("scheduled_date DESC, scheduled_time DESC").Find(&schedules).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil jadwal anak: %w", err)
	}
	return schedules, nil
}

// GetUpcomingSchedules retrieves upcoming schedules for a child
func (s *ScheduleService) GetUpcomingSchedules(childID uint, days int) ([]model.Schedule, error) {
	var schedules []model.Schedule
	now := time.Now()
	futureDate := now.AddDate(0, 0, days)

	if err := s.db.Preload("Activity").
		Where("child_id = ? AND scheduled_date >= ? AND scheduled_date <= ? AND is_completed = ?", childID, now, futureDate, false).
		Order("scheduled_date ASC, scheduled_time ASC").
		Find(&schedules).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil jadwal mendatang: %w", err)
	}
	return schedules, nil
}

// GetTodaySchedules retrieves today's schedules for a child
func (s *ScheduleService) GetTodaySchedules(childID uint) ([]model.Schedule, error) {
	var schedules []model.Schedule
	today := time.Now().Format("2006-01-02")

	if err := s.db.Preload("Activity").
		Where("child_id = ? AND DATE(scheduled_date) = ? AND is_completed = ?", childID, today, false).
		Order("scheduled_time ASC").
		Find(&schedules).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil jadwal hari ini: %w", err)
	}
	return schedules, nil
}

// UpdateSchedule updates an existing schedule
func (s *ScheduleService) UpdateSchedule(scheduleID uint, activityID *uint, scheduledDate time.Time, scheduledTime, notes string, recurrencePattern string, durationMinutes int) (*model.Schedule, error) {
	var schedule model.Schedule
	if err := s.db.First(&schedule, scheduleID).Error; err != nil {
		return nil, fmt.Errorf("jadwal tidak ditemukan: %w", err)
	}

	schedule.ActivityID = activityID
	schedule.ScheduledDate = scheduledDate
	schedule.ScheduledTime = scheduledTime
	schedule.Notes = notes
	schedule.RecurrencePattern = recurrencePattern
	schedule.DurationMinutes = durationMinutes

	if err := s.db.Save(&schedule).Error; err != nil {
		return nil, fmt.Errorf("gagal memperbarui jadwal: %w", err)
	}

	// Load relationships
	if err := s.db.Preload("Child").Preload("Activity").First(&schedule, schedule.ID).Error; err != nil {
		return nil, fmt.Errorf("gagal memuat data jadwal: %w", err)
	}

	return &schedule, nil
}

// CompleteSchedule marks a schedule as completed
func (s *ScheduleService) CompleteSchedule(scheduleID uint) (*model.Schedule, error) {
	var schedule model.Schedule
	if err := s.db.First(&schedule, scheduleID).Error; err != nil {
		return nil, fmt.Errorf("jadwal tidak ditemukan: %w", err)
	}

	if schedule.IsCompleted {
		return nil, fmt.Errorf("jadwal sudah diselesaikan")
	}

	now := time.Now()
	schedule.IsCompleted = true
	schedule.CompletedAt = &now

	if err := s.db.Save(&schedule).Error; err != nil {
		return nil, fmt.Errorf("gagal menyelesaikan jadwal: %w", err)
	}

	// Load relationships
	if err := s.db.Preload("Child").Preload("Activity").First(&schedule, schedule.ID).Error; err != nil {
		return nil, fmt.Errorf("gagal memuat data jadwal: %w", err)
	}

	return &schedule, nil
}

// DeleteSchedule deletes a schedule
func (s *ScheduleService) DeleteSchedule(scheduleID uint) error {
	if err := s.db.Delete(&model.Schedule{}, scheduleID).Error; err != nil {
		return fmt.Errorf("gagal menghapus jadwal: %w", err)
	}
	return nil
}

// CreateRecurringSchedules creates recurring schedules based on pattern
func (s *ScheduleService) CreateRecurringSchedules(childID uint, activityID *uint, startDate time.Time, scheduledTime, notes string, recurrencePattern string, recurrenceEndDate time.Time, durationMinutes int) ([]model.Schedule, error) {
	var schedules []model.Schedule
	currentDate := startDate

	// Generate schedules based on recurrence pattern
	for currentDate.Before(recurrenceEndDate) || currentDate.Equal(recurrenceEndDate) {
		schedule := &model.Schedule{
			ChildID:           childID,
			ActivityID:        activityID,
			ScheduledDate:     currentDate,
			ScheduledTime:     scheduledTime,
			Notes:             notes,
			RecurrencePattern: recurrencePattern,
			RecurrenceEndDate: &recurrenceEndDate,
			DurationMinutes:   durationMinutes,
			Reminder:          true,
			ReminderMinutes:   15,
		}

		if err := s.db.Create(schedule).Error; err != nil {
			continue // Skip if error
		}

		schedules = append(schedules, *schedule)

		// Move to next occurrence
		switch recurrencePattern {
		case "daily":
			currentDate = currentDate.AddDate(0, 0, 1)
		case "weekly":
			currentDate = currentDate.AddDate(0, 0, 7)
		case "monthly":
			currentDate = currentDate.AddDate(0, 1, 0)
		default:
			break
		}
	}

	return schedules, nil
}

// GetScheduleStats returns statistics about schedules for a child
func (s *ScheduleService) GetScheduleStats(childID uint) (map[string]interface{}, error) {
	var totalSchedules int64
	var completedSchedules int64
	var upcomingSchedules int64

	// Total schedules
	if err := s.db.Model(&model.Schedule{}).Where("child_id = ?", childID).Count(&totalSchedules).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung total jadwal: %w", err)
	}

	// Completed schedules
	if err := s.db.Model(&model.Schedule{}).Where("child_id = ? AND is_completed = ?", childID, true).Count(&completedSchedules).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung jadwal selesai: %w", err)
	}

	// Upcoming schedules (next 7 days)
	futureDate := time.Now().AddDate(0, 0, 7)
	if err := s.db.Model(&model.Schedule{}).
		Where("child_id = ? AND scheduled_date >= ? AND scheduled_date <= ? AND is_completed = ?", childID, time.Now(), futureDate, false).
		Count(&upcomingSchedules).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung jadwal mendatang: %w", err)
	}

	stats := map[string]interface{}{
		"total_schedules":     totalSchedules,
		"completed_schedules": completedSchedules,
		"upcoming_schedules":  upcomingSchedules,
		"completion_rate":     0.0,
		"child_id":            childID,
	}

	if totalSchedules > 0 {
		stats["completion_rate"] = float64(completedSchedules) / float64(totalSchedules) * 100
	}

	return stats, nil
}
