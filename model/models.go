package model

import (
	"time"

	"gorm.io/gorm"
)

// Child represents the 'children' table.
type Child struct {
	gorm.Model

	Name               string `gorm:"not null"`
	DateOfBirth        *time.Time
	Gender             string
	ParentGuardianName string
	ContactInfo        string
	InitialAssessment  string
	Sessions           []Session `gorm:"foreignKey:ChildID"`
	Rewards            []Reward  `gorm:"foreignKey:ChildID"`
	Goals              []Goal    `gorm:"foreignKey:ChildID"`
}

// Session represents the 'sessions' table.
type Session struct {
	gorm.Model

	ChildID           uint      `gorm:"not null"`
	Child             Child     // Belongs-to relationship with Child
	StartTime         time.Time `gorm:"not null"`
	EndTime           *time.Time
	DurationMinutes   int
	SummaryNotes      string             // Auto-formatted summary notes
	Notes             []Note             `gorm:"foreignKey:SessionID"` // One-to-many relationship with Note
	SessionActivities []SessionActivity  `gorm:"foreignKey:SessionID"` // One-to-many relationship with SessionActivity
	SessionFlashcards []SessionFlashcard `gorm:"foreignKey:SessionID"` // One-to-many relationship with SessionFlashcard
	Rewards           []Reward           `gorm:"foreignKey:SessionID"` // One-to-many relationship with Reward (optional)
}

// Activity represents the 'activities' table.
type Activity struct {
	gorm.Model

	Name                   string `gorm:"not null;unique"`
	Description            string
	DefaultDurationMinutes int
	Category               string
	Objectives             string
	SessionActivities      []SessionActivity `gorm:"foreignKey:ActivityID"`
}

// SessionActivity represents the 'session_activities' table,
// linking activities to a specific session.
type SessionActivity struct {
	gorm.Model

	SessionID  uint `gorm:"not null"`
	Session    Session
	ActivityID uint `gorm:"not null"`
	Activity   Activity
	StartTime  *time.Time
	EndTime    *time.Time
	Notes      string
}

// NoteCategory represents predefined note categories with colors and icons
type NoteCategory struct {
	gorm.Model

	Name        string `gorm:"uniqueIndex;not null"` // "Perilaku", "Kemajuan", etc.
	Description string
	Color       string `gorm:"default:'#6B7280'"`  // Hex color code
	Icon        string `gorm:"default:'FileText'"` // Lucide icon name
	IsActive    bool   `gorm:"default:true"`
	SortOrder   int    `gorm:"default:0"`
}

// Note represents the 'notes' table for quick note-taking.
type Note struct {
	gorm.Model

	SessionID      uint `gorm:"not null"`
	Session        Session
	NoteCategoryID *uint // Foreign key to NoteCategory (optional for backward compatibility)
	NoteCategory   *NoteCategory
	NoteText       string    `gorm:"not null"`
	Category       string    // Deprecated, use NoteCategory
	Timestamp      time.Time `gorm:"not null"`
	IsEncrypted    bool      `gorm:"default:false"`
}

// NoteTemplate represents the 'note_templates' table for customizable templates.
type NoteTemplate struct {
	gorm.Model

	TemplateText string `gorm:"not null;unique"`
	CategoryHint string
	Keywords     string
}

// RewardType represents predefined reward types with icons and colors
type RewardType struct {
	gorm.Model

	Name         string `gorm:"uniqueIndex;not null"` // "sticker", "star", "point"
	DisplayName  string `gorm:"not null"`             // "Stiker", "Bintang", "Poin"
	Icon         string // "Sticker", "Star", "Award" (Lucide icon name)
	Color        string `gorm:"default:'#3B82F6'"` // Hex color code
	Description  string
	DefaultValue int  `gorm:"default:1"`    // Default value when given
	IsActive     bool `gorm:"default:true"` // Can be disabled
	SortOrder    int  `gorm:"default:0"`    // Display order
}

// Reward represents the 'rewards' table.
type Reward struct {
	gorm.Model

	ChildID      uint    `gorm:"not null"`
	Child        Child   // Belongs-to relationship with Child
	SessionID    *uint   // Can be null if reward is given outside a specific session
	Session      Session `gorm:"foreignKey:SessionID"`
	RewardTypeID *uint   // Foreign key to RewardType (optional for backward compatibility)
	RewardType   *RewardType
	Type         string    `gorm:"not null"` // e.g., "Star", "Point", "Sticker" (deprecated, use RewardType)
	Value        int       `gorm:"default:1"`
	Timestamp    time.Time `gorm:"not null"`
	Notes        string
}

// Goal represents the 'goals' table for tracking therapy goals.
type Goal struct {
	gorm.Model

	ChildID      uint   `gorm:"not null"`
	Child        Child  // Belongs-to relationship with Child
	Name         string `gorm:"not null"`
	Description  string
	TargetValue  int
	TargetType   string    // e.g., "stickers", "sessions_without_tantrum"
	StartDate    time.Time `gorm:"not null"`
	EndDate      *time.Time
	IsAchieved   bool `gorm:"default:false"`
	AchievedDate *time.Time
}

// Flashcard represents the 'flashcards' table.
type Flashcard struct {
	gorm.Model

	Category          string `gorm:"not null"`
	TextContent       string
	ImagePath         string
	Description       string
	SessionFlashcards []SessionFlashcard `gorm:"foreignKey:FlashcardID"`
}

// SessionFlashcard represents the 'session_flashcards' table,
// logging flashcard usage within a session.
type SessionFlashcard struct {
	gorm.Model

	SessionID     uint `gorm:"not null"`
	Session       Session
	FlashcardID   uint `gorm:"not null"`
	Flashcard     Flashcard
	ResponseTag   string
	ResponseNotes string
	Timestamp     time.Time `gorm:"not null"`
}

// Schedule represents the 'schedules' table for therapy session scheduling.
type Schedule struct {
	gorm.Model

	ChildID           uint       `gorm:"not null"`
	Child             Child      // Belongs-to relationship with Child
	ActivityID        *uint      // Optional: specific activity scheduled
	Activity          *Activity  // Belongs-to relationship with Activity
	ScheduledDate     time.Time  `gorm:"not null"` // Date of the scheduled session
	ScheduledTime     string     `gorm:"not null"` // Time in HH:MM format
	DurationMinutes   int        `gorm:"default:60"`
	Notes             string     // Session notes/description
	RecurrencePattern string     // "none", "daily", "weekly", "monthly"
	RecurrenceEndDate *time.Time // End date for recurring schedules
	IsCompleted       bool       `gorm:"default:false"`
	CompletedAt       *time.Time // When the scheduled session was completed
	Reminder          bool       `gorm:"default:true"` // Enable reminder notifications
	ReminderMinutes   int        `gorm:"default:15"`   // Minutes before session
}

// SessionTemplate represents pre-built session structures
type SessionTemplate struct {
	gorm.Model

	Name            string `gorm:"not null;unique"`
	Description     string
	Category        string // "behavioral", "speech", "occupational", "general"
	DurationMinutes int    `gorm:"default:60"`
	Objectives      string // Main goals/objectives for this template
	Instructions    string // Step-by-step instructions for therapist
	Materials       string // Required materials/equipment
	AgeRangeMin     int    `gorm:"default:2"`  // Minimum age in years
	AgeRangeMax     int    `gorm:"default:18"` // Maximum age in years
	IsActive        bool   `gorm:"default:true"`
	UsageCount      int    `gorm:"default:0"` // Track how often template is used
	CreatedBy       string // Therapist who created template
	Tags            string // Comma-separated tags for filtering
	SortOrder       int    `gorm:"default:0"`

	// Template activities - JSON stored as string for flexibility
	ActivitiesJSON string // JSON array of activities with durations and notes
	GoalsJSON      string // JSON array of session goals
	NotesTemplate  string // Pre-filled notes template with placeholders
}
