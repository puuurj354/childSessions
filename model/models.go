package model

import (
	"time"

	"gorm.io/gorm"
)

// Child represents the 'children' table.
type Child struct {
	gorm.Model 

	Name                string    `gorm:"not null"`
	DateOfBirth         *time.Time
	Gender              string
	ParentGuardianName  string
	ContactInfo         string
	InitialAssessment   string 
	Sessions            []Session `gorm:"foreignKey:ChildID"` 
	Rewards             []Reward  `gorm:"foreignKey:ChildID"` 
	Goals               []Goal    `gorm:"foreignKey:ChildID"` 
}

// Session represents the 'sessions' table.
type Session struct {
	gorm.Model 

	ChildID          uint `gorm:"not null"`
	Child            Child // Belongs-to relationship with Child
	StartTime        time.Time `gorm:"not null"`
	EndTime          *time.Time
	DurationMinutes  int
	SummaryNotes     string // Auto-formatted summary notes
	Notes            []Note `gorm:"foreignKey:SessionID"` // One-to-many relationship with Note
	SessionActivities []SessionActivity `gorm:"foreignKey:SessionID"` // One-to-many relationship with SessionActivity
	SessionFlashcards []SessionFlashcard `gorm:"foreignKey:SessionID"` // One-to-many relationship with SessionFlashcard
	Rewards          []Reward `gorm:"foreignKey:SessionID"` // One-to-many relationship with Reward (optional)
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

	SessionID uint `gorm:"not null"`
	Session   Session 
	ActivityID uint `gorm:"not null"`
	Activity  Activity 
	StartTime *time.Time
	EndTime   *time.Time
	Notes     string 
}

// Note represents the 'notes' table for quick note-taking.
type Note struct {
	gorm.Model 

	SessionID   uint `gorm:"not null"`
	Session     Session 
	NoteText    string `gorm:"not null"` 
	Category    string
	Timestamp   time.Time `gorm:"not null"`
	IsEncrypted bool      `gorm:"default:false"` 
}

// NoteTemplate represents the 'note_templates' table for customizable templates.
type NoteTemplate struct {
	gorm.Model 

	TemplateText string `gorm:"not null;unique"`
	CategoryHint string
	Keywords     string 
}

// Reward represents the 'rewards' table.
type Reward struct {
	gorm.Model 

	ChildID   uint `gorm:"not null"`
	Child     Child // Belongs-to relationship with Child
	SessionID *uint // Can be null if reward is given outside a specific session
	Session   Session `gorm:"foreignKey:SessionID"` 
	Type      string `gorm:"not null"` // e.g., "Star", "Point", "Sticker"
	Value     int    `gorm:"default:1"`
	Timestamp time.Time `gorm:"not null"`
	Notes     string
}

// Goal represents the 'goals' table for tracking therapy goals.
type Goal struct {
	gorm.Model 

	ChildID      uint `gorm:"not null"`
	Child        Child // Belongs-to relationship with Child
	Name         string `gorm:"not null"`
	Description  string
	TargetValue  int
	TargetType   string    // e.g., "stickers", "sessions_without_tantrum"
	StartDate    time.Time `gorm:"not null"`
	EndDate      *time.Time
	IsAchieved   bool      `gorm:"default:false"`
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

	SessionID    uint `gorm:"not null"`
	Session      Session 
	FlashcardID  uint `gorm:"not null"`
	Flashcard    Flashcard 
	ResponseTag  string 
	ResponseNotes string
	Timestamp    time.Time `gorm:"not null"`
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


