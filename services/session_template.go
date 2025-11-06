package services

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"

	"childSessions/model"
)

type SessionTemplateService struct {
	db *gorm.DB
}

func NewSessionTemplateService(db *gorm.DB) *SessionTemplateService {
	return &SessionTemplateService{db: db}
}

// GetAllSessionTemplates returns all active session templates
func (s *SessionTemplateService) GetAllSessionTemplates() ([]model.SessionTemplate, error) {
	var templates []model.SessionTemplate
	err := s.db.Where("is_active = ?", true).Order("sort_order ASC, name ASC").Find(&templates).Error
	return templates, err
}

// GetSessionTemplatesByCategory returns templates filtered by category
func (s *SessionTemplateService) GetSessionTemplatesByCategory(category string) ([]model.SessionTemplate, error) {
	var templates []model.SessionTemplate
	err := s.db.Where("is_active = ? AND category = ?", true, category).Order("sort_order ASC, name ASC").Find(&templates).Error
	return templates, err
}

// GetSessionTemplateByID returns a specific session template
func (s *SessionTemplateService) GetSessionTemplateByID(id uint) (*model.SessionTemplate, error) {
	var template model.SessionTemplate
	err := s.db.First(&template, id).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

// CreateSessionTemplate creates a new session template
func (s *SessionTemplateService) CreateSessionTemplate(name, description, category string, durationMinutes int, objectives, instructions, materials, createdBy, tags string, ageRangeMin, ageRangeMax int, activitiesJSON, goalsJSON, notesTemplate string) (*model.SessionTemplate, error) {
	template := model.SessionTemplate{
		Name:            name,
		Description:     description,
		Category:        category,
		DurationMinutes: durationMinutes,
		Objectives:      objectives,
		Instructions:    instructions,
		Materials:       materials,
		AgeRangeMin:     ageRangeMin,
		AgeRangeMax:     ageRangeMax,
		IsActive:        true,
		UsageCount:      0,
		CreatedBy:       createdBy,
		Tags:            tags,
		ActivitiesJSON:  activitiesJSON,
		GoalsJSON:       goalsJSON,
		NotesTemplate:   notesTemplate,
	}

	err := s.db.Create(&template).Error
	if err != nil {
		return nil, err
	}

	return &template, nil
}

// UpdateSessionTemplate updates an existing session template
func (s *SessionTemplateService) UpdateSessionTemplate(id uint, name, description, category string, durationMinutes int, objectives, instructions, materials, tags string, ageRangeMin, ageRangeMax int, activitiesJSON, goalsJSON, notesTemplate string) error {
	updates := map[string]interface{}{
		"name":             name,
		"description":      description,
		"category":         category,
		"duration_minutes": durationMinutes,
		"objectives":       objectives,
		"instructions":     instructions,
		"materials":        materials,
		"tags":             tags,
		"age_range_min":    ageRangeMin,
		"age_range_max":    ageRangeMax,
		"activities_json":  activitiesJSON,
		"goals_json":       goalsJSON,
		"notes_template":   notesTemplate,
	}

	return s.db.Model(&model.SessionTemplate{}).Where("id = ?", id).Updates(updates).Error
}

// DeleteSessionTemplate soft deletes a session template
func (s *SessionTemplateService) DeleteSessionTemplate(id uint) error {
	return s.db.Model(&model.SessionTemplate{}).Where("id = ?", id).Update("is_active", false).Error
}

// IncrementUsageCount increments the usage count when template is used
func (s *SessionTemplateService) IncrementUsageCount(id uint) error {
	return s.db.Model(&model.SessionTemplate{}).Where("id = ?", id).Update("usage_count", gorm.Expr("usage_count + 1")).Error
}

// CreateSessionFromTemplate creates a new session using template data
func (s *SessionTemplateService) CreateSessionFromTemplate(templateID uint, childID uint, startTime string, therapistName string) (*model.Session, error) {
	// Get the template
	template, err := s.GetSessionTemplateByID(templateID)
	if err != nil {
		return nil, fmt.Errorf("template not found: %w", err)
	}

	// Parse activities JSON to create session activities
	var activities []map[string]interface{}
	if template.ActivitiesJSON != "" {
		if err := json.Unmarshal([]byte(template.ActivitiesJSON), &activities); err != nil {
			return nil, fmt.Errorf("invalid activities JSON: %w", err)
		}
	}

	// Parse start time
	parsedStartTime, err := time.Parse(time.RFC3339, startTime)
	if err != nil {
		// If parsing fails, use current time
		parsedStartTime = time.Now()
	}

	// Create session with basic template data
	session := model.Session{
		ChildID:         childID,
		StartTime:       parsedStartTime,
		DurationMinutes: template.DurationMinutes,
		SummaryNotes:    fmt.Sprintf("Session based on template: %s\n\nObjectives: %s\n\nInstructions:\n%s\n\nMaterials: %s", template.Name, template.Objectives, template.Instructions, template.Materials),
	}

	// Begin transaction
	tx := s.db.Begin()

	// Create the session
	if err := tx.Create(&session).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	// Create session activities from template
	for _, activityData := range activities {
		activityName, _ := activityData["name"].(string)
		activityNotes, _ := activityData["notes"].(string)
		duration := int(activityData["duration"].(float64))

		// Find or create activity
		var activity model.Activity
		err := tx.Where("name = ?", activityName).First(&activity).Error
		if err == gorm.ErrRecordNotFound {
			// Create new activity
			activity = model.Activity{
				Name:                   activityName,
				Description:            activityNotes,
				DefaultDurationMinutes: duration,
				Category:               template.Category,
			}
			if err := tx.Create(&activity).Error; err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("failed to create activity: %w", err)
			}
		}

		// Create session activity
		sessionActivity := model.SessionActivity{
			SessionID:  session.ID,
			ActivityID: activity.ID,
			Notes:      activityNotes,
		}
		if err := tx.Create(&sessionActivity).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create session activity: %w", err)
		}
	}

	// Increment template usage count
	if err := tx.Model(&model.SessionTemplate{}).Where("id = ?", templateID).Update("usage_count", gorm.Expr("usage_count + 1")).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to increment usage count: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Reload session with relationships
	if err := s.db.Preload("SessionActivities.Activity").First(&session, session.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to reload session: %w", err)
	}

	return &session, nil
}

// GetTemplateCategories returns unique categories
func (s *SessionTemplateService) GetTemplateCategories() ([]string, error) {
	var categories []string
	err := s.db.Model(&model.SessionTemplate{}).
		Where("is_active = ?", true).
		Distinct("category").
		Pluck("category", &categories).Error
	return categories, err
}

// SearchTemplates searches templates by name, description, tags
func (s *SessionTemplateService) SearchTemplates(query string) ([]model.SessionTemplate, error) {
	var templates []model.SessionTemplate
	searchPattern := "%" + query + "%"
	err := s.db.Where("is_active = ? AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)",
		true, searchPattern, searchPattern, searchPattern).
		Order("usage_count DESC, name ASC").
		Find(&templates).Error
	return templates, err
}
