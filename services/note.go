package services

import (
	"childSessions/model"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type NoteService struct {
	db *gorm.DB
}

func NewNoteService(db *gorm.DB) *NoteService {
	return &NoteService{db: db}
}

// CreateNote creates a new note for a session
func (s *NoteService) CreateNote(sessionID uint, noteText, category string) (*model.Note, error) {
	if noteText == "" {
		return nil, errors.New("teks catatan harus diisi")
	}

	note := &model.Note{
		SessionID: sessionID,
		NoteText:  noteText,
		Category:  category,
		Timestamp: time.Now(),
	}

	if err := s.db.Create(note).Error; err != nil {
		return nil, fmt.Errorf("gagal membuat catatan: %w", err)
	}

	return note, nil
}

// GetNotesBySession retrieves all notes for a specific session
func (s *NoteService) GetNotesBySession(sessionID uint) ([]model.Note, error) {
	var notes []model.Note
	if err := s.db.Where("session_id = ?", sessionID).Order("timestamp DESC").Find(&notes).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil catatan: %w", err)
	}
	return notes, nil
}

// GetAllNoteCategories retrieves all active note categories
func (s *NoteService) GetAllNoteCategories() ([]model.NoteCategory, error) {
	var categories []model.NoteCategory
	if err := s.db.Where("is_active = ?", true).Order("sort_order ASC").Find(&categories).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil kategori catatan: %w", err)
	}
	return categories, nil
}

// GetNoteCategoryByID retrieves a specific note category by ID
func (s *NoteService) GetNoteCategoryByID(id uint) (*model.NoteCategory, error) {
	var category model.NoteCategory
	if err := s.db.First(&category, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("kategori catatan tidak ditemukan")
		}
		return nil, fmt.Errorf("gagal mengambil kategori catatan: %w", err)
	}
	return &category, nil
}

// CreateNoteWithCategory creates a new note with a category
func (s *NoteService) CreateNoteWithCategory(sessionID uint, noteText string, categoryID uint) (*model.Note, error) {
	if noteText == "" {
		return nil, errors.New("teks catatan harus diisi")
	}

	// Verify category exists
	category, err := s.GetNoteCategoryByID(categoryID)
	if err != nil {
		return nil, err
	}

	note := &model.Note{
		SessionID:      sessionID,
		NoteText:       noteText,
		NoteCategoryID: &categoryID,
		Category:       category.Name, // Keep for backward compatibility
		Timestamp:      time.Now(),
	}

	if err := s.db.Create(note).Error; err != nil {
		return nil, fmt.Errorf("gagal membuat catatan: %w", err)
	}

	// Load relationships
	if err := s.db.Preload("NoteCategory").First(note, note.ID).Error; err != nil {
		return nil, fmt.Errorf("gagal memuat data catatan: %w", err)
	}

	return note, nil
}

// UpdateNote updates an existing note
func (s *NoteService) UpdateNote(noteID uint, noteText, category string) (*model.Note, error) {
	var note model.Note
	if err := s.db.First(&note, noteID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("catatan tidak ditemukan")
		}
		return nil, fmt.Errorf("gagal mengambil catatan: %w", err)
	}

	note.NoteText = noteText
	note.Category = category

	if err := s.db.Save(&note).Error; err != nil {
		return nil, fmt.Errorf("gagal memperbarui catatan: %w", err)
	}

	return &note, nil
}

// DeleteNote soft deletes a note
func (s *NoteService) DeleteNote(noteID uint) error {
	if err := s.db.Delete(&model.Note{}, noteID).Error; err != nil {
		return fmt.Errorf("gagal menghapus catatan: %w", err)
	}
	return nil
}

// GetNoteTemplates retrieves all available note templates
func (s *NoteService) GetNoteTemplates() ([]model.NoteTemplate, error) {
	var templates []model.NoteTemplate
	if err := s.db.Find(&templates).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil template catatan: %w", err)
	}
	return templates, nil
}

// CreateNoteTemplate creates a new note template
func (s *NoteService) CreateNoteTemplate(templateText, categoryHint, keywords string) (*model.NoteTemplate, error) {
	if templateText == "" {
		return nil, errors.New("teks template harus diisi")
	}

	template := &model.NoteTemplate{
		TemplateText: templateText,
		CategoryHint: categoryHint,
		Keywords:     keywords,
	}

	if err := s.db.Create(template).Error; err != nil {
		return nil, fmt.Errorf("gagal membuat template: %w", err)
	}

	return template, nil
}

// SearchNotesByKeyword searches notes by keyword
func (s *NoteService) SearchNotesByKeyword(keyword string) ([]model.Note, error) {
	var notes []model.Note
	if err := s.db.Where("note_text LIKE ?", "%"+keyword+"%").
		Preload("Session").
		Preload("Session.Child").
		Order("timestamp DESC").
		Find(&notes).Error; err != nil {
		return nil, fmt.Errorf("gagal mencari catatan: %w", err)
	}
	return notes, nil
}
