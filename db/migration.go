package db

import (
	"childSessions/model"
	"fmt"
	"log"

	"gorm.io/gorm"
)

// MigrationInfo holds information about each migration
type MigrationInfo struct {
	Version     string
	Description string
	Up          func(*gorm.DB) error
	Down        func(*gorm.DB) error
}

// Migration represents a database migration record
type Migration struct {
	ID          uint   `gorm:"primaryKey"`
	Version     string `gorm:"uniqueIndex;not null"`
	Description string
	AppliedAt   int64 `gorm:"autoCreateTime"`
}

// GetAllMigrations returns all available migrations in order
func GetAllMigrations() []MigrationInfo {
	return []MigrationInfo{
		{
			Version:     "001_create_base_tables",
			Description: "Create base tables for children, sessions, activities",
			Up:          migration001Up,
			Down:        migration001Down,
		},
		{
			Version:     "002_create_notes_and_templates",
			Description: "Create notes and note templates tables",
			Up:          migration002Up,
			Down:        migration002Down,
		},
		{
			Version:     "003_create_rewards_and_goals",
			Description: "Create rewards and goals tables",
			Up:          migration003Up,
			Down:        migration003Down,
		},
		{
			Version:     "004_create_flashcards",
			Description: "Create flashcards and session flashcards tables",
			Up:          migration004Up,
			Down:        migration004Down,
		},
		{
			Version:     "005_add_indexes_and_constraints",
			Description: "Add database indexes and constraints for performance",
			Up:          migration005Up,
			Down:        migration005Down,
		},
		{
			Version:     "006_create_schedules",
			Description: "Create schedules table for therapy session scheduling",
			Up:          migration006Up,
			Down:        migration006Down,
		},
		{
			Version:     "007_create_reward_types",
			Description: "Create reward types table with seed data",
			Up:          migration007Up,
			Down:        migration007Down,
		},
		{
			Version:     "008_create_note_categories",
			Description: "Create note categories table with seed data",
			Up:          migration008Up,
			Down:        migration008Down,
		},
		{
			Version:     "009_create_session_templates",
			Description: "Create session templates table with seed data",
			Up:          migration009Up,
			Down:        migration009Down,
		},
	}
}

// RunMigrationsManual runs migrations manually with version control
func RunMigrationsManual(db *gorm.DB) error {
	// Create migrations table if it doesn't exist
	if err := db.AutoMigrate(&Migration{}); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	migrations := GetAllMigrations()

	for _, migration := range migrations {
		// Check if migration already applied
		var existingMigration Migration
		result := db.Where("version = ?", migration.Version).First(&existingMigration)

		if result.Error == nil {
			log.Printf("Migration %s already applied, skipping", migration.Version)
			continue
		}

		log.Printf("Running migration: %s - %s", migration.Version, migration.Description)

		// Run the migration
		if err := migration.Up(db); err != nil {
			return fmt.Errorf("failed to run migration %s: %w", migration.Version, err)
		}

		// Record the migration
		migrationRecord := Migration{
			Version:     migration.Version,
			Description: migration.Description,
		}
		if err := db.Create(&migrationRecord).Error; err != nil {
			return fmt.Errorf("failed to record migration %s: %w", migration.Version, err)
		}

		log.Printf("Migration %s completed successfully", migration.Version)
	}

	return nil
}

// RollbackMigration rolls back a specific migration
func RollbackMigration(db *gorm.DB, version string) error {
	migrations := GetAllMigrations()

	var targetMigration *MigrationInfo
	for _, migration := range migrations {
		if migration.Version == version {
			targetMigration = &migration
			break
		}
	}

	if targetMigration == nil {
		return fmt.Errorf("migration %s not found", version)
	}

	// Check if migration was applied
	var existingMigration Migration
	result := db.Where("version = ?", version).First(&existingMigration)
	if result.Error != nil {
		return fmt.Errorf("migration %s was not applied", version)
	}

	log.Printf("Rolling back migration: %s - %s", targetMigration.Version, targetMigration.Description)

	// Run the rollback
	if err := targetMigration.Down(db); err != nil {
		return fmt.Errorf("failed to rollback migration %s: %w", version, err)
	}

	// Remove the migration record
	if err := db.Delete(&existingMigration).Error; err != nil {
		return fmt.Errorf("failed to remove migration record %s: %w", version, err)
	}

	log.Printf("Migration %s rolled back successfully", version)
	return nil
}

// Migration 001: Create base tables
func migration001Up(db *gorm.DB) error {
	// Create children table
	if err := db.AutoMigrate(&model.Child{}); err != nil {
		return err
	}

	// Create sessions table
	if err := db.AutoMigrate(&model.Session{}); err != nil {
		return err
	}

	// Create activities table
	if err := db.AutoMigrate(&model.Activity{}); err != nil {
		return err
	}

	// Create session_activities table
	if err := db.AutoMigrate(&model.SessionActivity{}); err != nil {
		return err
	}

	return nil
}

func migration001Down(db *gorm.DB) error {
	// Drop tables in reverse order to handle foreign key constraints
	if err := db.Migrator().DropTable(&model.SessionActivity{}); err != nil {
		return err
	}
	if err := db.Migrator().DropTable(&model.Activity{}); err != nil {
		return err
	}
	if err := db.Migrator().DropTable(&model.Session{}); err != nil {
		return err
	}
	if err := db.Migrator().DropTable(&model.Child{}); err != nil {
		return err
	}
	return nil
}

// Migration 002: Create notes and templates
func migration002Up(db *gorm.DB) error {
	// Create notes table
	if err := db.AutoMigrate(&model.Note{}); err != nil {
		return err
	}

	// Create note_templates table
	if err := db.AutoMigrate(&model.NoteTemplate{}); err != nil {
		return err
	}

	return nil
}

func migration002Down(db *gorm.DB) error {
	if err := db.Migrator().DropTable(&model.Note{}); err != nil {
		return err
	}
	if err := db.Migrator().DropTable(&model.NoteTemplate{}); err != nil {
		return err
	}
	return nil
}

// Migration 003: Create rewards and goals
func migration003Up(db *gorm.DB) error {
	// Create rewards table
	if err := db.AutoMigrate(&model.Reward{}); err != nil {
		return err
	}

	// Create goals table
	if err := db.AutoMigrate(&model.Goal{}); err != nil {
		return err
	}

	return nil
}

func migration003Down(db *gorm.DB) error {
	if err := db.Migrator().DropTable(&model.Reward{}); err != nil {
		return err
	}
	if err := db.Migrator().DropTable(&model.Goal{}); err != nil {
		return err
	}
	return nil
}

// Migration 004: Create flashcards
func migration004Up(db *gorm.DB) error {
	// Create flashcards table
	if err := db.AutoMigrate(&model.Flashcard{}); err != nil {
		return err
	}

	// Create session_flashcards table
	if err := db.AutoMigrate(&model.SessionFlashcard{}); err != nil {
		return err
	}

	return nil
}

func migration004Down(db *gorm.DB) error {
	if err := db.Migrator().DropTable(&model.SessionFlashcard{}); err != nil {
		return err
	}
	if err := db.Migrator().DropTable(&model.Flashcard{}); err != nil {
		return err
	}
	return nil
}

// Migration 005: Add indexes and constraints
func migration005Up(db *gorm.DB) error {
	// Add indexes for better performance

	// Children table indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_children_name ON children(name)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_children_deleted_at ON children(deleted_at)").Error; err != nil {
		return err
	}

	// Sessions table indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_sessions_child_id ON sessions(child_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions(deleted_at)").Error; err != nil {
		return err
	}

	// Activities table indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_activities_name ON activities(name)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON activities(deleted_at)").Error; err != nil {
		return err
	}

	// SessionActivities table indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_activities_session_id ON session_activities(session_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_activities_activity_id ON session_activities(activity_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_activities_deleted_at ON session_activities(deleted_at)").Error; err != nil {
		return err
	}

	// Notes table indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_notes_session_id ON notes(session_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON notes(timestamp)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at)").Error; err != nil {
		return err
	}

	// Rewards table indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_rewards_child_id ON rewards(child_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_rewards_session_id ON rewards(session_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_rewards_timestamp ON rewards(timestamp)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_rewards_deleted_at ON rewards(deleted_at)").Error; err != nil {
		return err
	}

	// Goals table indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_goals_child_id ON goals(child_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_goals_start_date ON goals(start_date)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_goals_is_achieved ON goals(is_achieved)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_goals_deleted_at ON goals(deleted_at)").Error; err != nil {
		return err
	}

	// Flashcards table indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_flashcards_category ON flashcards(category)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_flashcards_deleted_at ON flashcards(deleted_at)").Error; err != nil {
		return err
	}

	// SessionFlashcards table indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_flashcards_session_id ON session_flashcards(session_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_flashcards_flashcard_id ON session_flashcards(flashcard_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_flashcards_timestamp ON session_flashcards(timestamp)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_flashcards_deleted_at ON session_flashcards(deleted_at)").Error; err != nil {
		return err
	}

	return nil
}

func migration005Down(db *gorm.DB) error {
	// Drop all indexes created in migration 005
	indexes := []string{
		"idx_children_name",
		"idx_children_deleted_at",
		"idx_sessions_child_id",
		"idx_sessions_start_time",
		"idx_sessions_deleted_at",
		"idx_activities_name",
		"idx_activities_deleted_at",
		"idx_session_activities_session_id",
		"idx_session_activities_activity_id",
		"idx_session_activities_deleted_at",
		"idx_notes_session_id",
		"idx_notes_timestamp",
		"idx_notes_category",
		"idx_notes_deleted_at",
		"idx_rewards_child_id",
		"idx_rewards_session_id",
		"idx_rewards_timestamp",
		"idx_rewards_deleted_at",
		"idx_goals_child_id",
		"idx_goals_start_date",
		"idx_goals_is_achieved",
		"idx_goals_deleted_at",
		"idx_flashcards_category",
		"idx_flashcards_deleted_at",
		"idx_session_flashcards_session_id",
		"idx_session_flashcards_flashcard_id",
		"idx_session_flashcards_timestamp",
		"idx_session_flashcards_deleted_at",
	}

	for _, index := range indexes {
		if err := db.Exec(fmt.Sprintf("DROP INDEX IF EXISTS %s", index)).Error; err != nil {
			return err
		}
	}

	return nil
}

// Migration 006: Create schedules table
func migration006Up(db *gorm.DB) error {
	// Create schedules table
	if err := db.AutoMigrate(&model.Schedule{}); err != nil {
		return err
	}

	// Add indexes for schedules
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_schedules_child_id ON schedules(child_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_schedules_activity_id ON schedules(activity_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_date ON schedules(scheduled_date)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_schedules_is_completed ON schedules(is_completed)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_schedules_deleted_at ON schedules(deleted_at)").Error; err != nil {
		return err
	}

	return nil
}

func migration006Down(db *gorm.DB) error {
	// Drop indexes
	indexes := []string{
		"idx_schedules_child_id",
		"idx_schedules_activity_id",
		"idx_schedules_scheduled_date",
		"idx_schedules_is_completed",
		"idx_schedules_deleted_at",
	}

	for _, index := range indexes {
		if err := db.Exec(fmt.Sprintf("DROP INDEX IF EXISTS %s", index)).Error; err != nil {
			return err
		}
	}

	// Drop table
	if err := db.Migrator().DropTable(&model.Schedule{}); err != nil {
		return err
	}

	return nil
}

// Migration 007: Create reward types table
func migration007Up(db *gorm.DB) error {
	// Create reward_types table
	if err := db.AutoMigrate(&model.RewardType{}); err != nil {
		return err
	}

	// Add indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_reward_types_is_active ON reward_types(is_active)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_reward_types_sort_order ON reward_types(sort_order)").Error; err != nil {
		return err
	}

	// Insert seed data (skip if already exists)
	rewardTypes := []model.RewardType{
		{Name: "sticker", DisplayName: "Stiker", Icon: "Sticker", Color: "#3B82F6", Description: "Stiker sebagai reward", DefaultValue: 1, IsActive: true, SortOrder: 1},
		{Name: "star", DisplayName: "Bintang", Icon: "Star", Color: "#F59E0B", Description: "Bintang sebagai reward", DefaultValue: 1, IsActive: true, SortOrder: 2},
		{Name: "point", DisplayName: "Poin", Icon: "Award", Color: "#10B981", Description: "Poin yang dapat dikumpulkan", DefaultValue: 10, IsActive: true, SortOrder: 3},
		{Name: "trophy", DisplayName: "Trofi", Icon: "Trophy", Color: "#EF4444", Description: "Trofi untuk pencapaian besar", DefaultValue: 1, IsActive: true, SortOrder: 4},
		{Name: "badge", DisplayName: "Lencana", Icon: "Medal", Color: "#8B5CF6", Description: "Lencana kehormatan", DefaultValue: 1, IsActive: true, SortOrder: 5},
	}

	for _, rt := range rewardTypes {
		// Check if reward type already exists
		var existing model.RewardType
		if err := db.Where("name = ?", rt.Name).First(&existing).Error; err == nil {
			// Already exists, skip
			continue
		}
		if err := db.Create(&rt).Error; err != nil {
			return err
		}
	}

	// Add reward_type_id column to rewards table
	if !db.Migrator().HasColumn(&model.Reward{}, "reward_type_id") {
		if err := db.Exec("ALTER TABLE rewards ADD COLUMN reward_type_id INTEGER").Error; err != nil {
			return err
		}
	}

	// Add foreign key index to rewards table
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_rewards_reward_type_id ON rewards(reward_type_id)").Error; err != nil {
		return err
	}

	return nil
}

func migration007Down(db *gorm.DB) error {
	// Drop indexes
	if err := db.Exec("DROP INDEX IF EXISTS idx_rewards_reward_type_id").Error; err != nil {
		return err
	}
	if err := db.Exec("DROP INDEX IF EXISTS idx_reward_types_is_active").Error; err != nil {
		return err
	}
	if err := db.Exec("DROP INDEX IF EXISTS idx_reward_types_sort_order").Error; err != nil {
		return err
	}

	// Drop table
	if err := db.Migrator().DropTable(&model.RewardType{}); err != nil {
		return err
	}

	return nil
}

// Migration 008: Create note categories table
func migration008Up(db *gorm.DB) error {
	// Create note_categories table
	if err := db.AutoMigrate(&model.NoteCategory{}); err != nil {
		return err
	}

	// Add indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_note_categories_is_active ON note_categories(is_active)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_note_categories_sort_order ON note_categories(sort_order)").Error; err != nil {
		return err
	}

	// Insert seed data (skip if already exists)
	noteCategories := []model.NoteCategory{
		{Name: "Perilaku", Description: "Catatan tentang perilaku anak", Color: "#EF4444", Icon: "AlertCircle", IsActive: true, SortOrder: 1},
		{Name: "Kemajuan", Description: "Catatan tentang kemajuan terapi", Color: "#10B981", Icon: "TrendingUp", IsActive: true, SortOrder: 2},
		{Name: "Tantangan", Description: "Tantangan yang dihadapi", Color: "#F59E0B", Icon: "AlertTriangle", IsActive: true, SortOrder: 3},
		{Name: "Komunikasi", Description: "Kemampuan komunikasi", Color: "#3B82F6", Icon: "MessageSquare", IsActive: true, SortOrder: 4},
		{Name: "Motorik", Description: "Perkembangan motorik", Color: "#8B5CF6", Icon: "Activity", IsActive: true, SortOrder: 5},
		{Name: "Sosial", Description: "Interaksi sosial", Color: "#EC4899", Icon: "Users", IsActive: true, SortOrder: 6},
		{Name: "Emosi", Description: "Pengelolaan emosi", Color: "#14B8A6", Icon: "Heart", IsActive: true, SortOrder: 7},
		{Name: "Lainnya", Description: "Catatan lainnya", Color: "#6B7280", Icon: "FileText", IsActive: true, SortOrder: 8},
	}

	for _, nc := range noteCategories {
		// Check if note category already exists
		var existing model.NoteCategory
		if err := db.Where("name = ?", nc.Name).First(&existing).Error; err == nil {
			// Already exists, skip
			continue
		}
		if err := db.Create(&nc).Error; err != nil {
			return err
		}
	}

	// Add note_category_id column to notes table
	if !db.Migrator().HasColumn(&model.Note{}, "note_category_id") {
		if err := db.Exec("ALTER TABLE notes ADD COLUMN note_category_id INTEGER").Error; err != nil {
			return err
		}
	}

	// Add foreign key index to notes table
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_notes_note_category_id ON notes(note_category_id)").Error; err != nil {
		return err
	}

	return nil
}

func migration008Down(db *gorm.DB) error {
	// Drop indexes
	if err := db.Exec("DROP INDEX IF EXISTS idx_notes_note_category_id").Error; err != nil {
		return err
	}
	if err := db.Exec("DROP INDEX IF EXISTS idx_note_categories_is_active").Error; err != nil {
		return err
	}
	if err := db.Exec("DROP INDEX IF EXISTS idx_note_categories_sort_order").Error; err != nil {
		return err
	}

	// Drop table
	if err := db.Migrator().DropTable(&model.NoteCategory{}); err != nil {
		return err
	}

	return nil
}

// Migration 009: Create session templates table
func migration009Up(db *gorm.DB) error {
	// Create session_templates table
	if err := db.AutoMigrate(&model.SessionTemplate{}); err != nil {
		return err
	}

	// Add indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_templates_category ON session_templates(category)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_templates_is_active ON session_templates(is_active)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_templates_sort_order ON session_templates(sort_order)").Error; err != nil {
		return err
	}

	// Insert seed templates
	sessionTemplates := []model.SessionTemplate{
		{
			Name:            "Basic Assessment Session",
			Description:     "Initial assessment session for new children",
			Category:        "assessment",
			DurationMinutes: 90,
			Objectives:      "Assess current developmental level, identify strengths and areas for improvement, establish baseline measurements",
			Instructions:    "1. Review child history\n2. Conduct standardized assessments\n3. Observe free play\n4. Document findings\n5. Discuss with parents",
			Materials:       "Assessment forms, toys for observation, timer, camera (if permitted)",
			AgeRangeMin:     2,
			AgeRangeMax:     18,
			IsActive:        true,
			CreatedBy:       "system",
			Tags:            "assessment,initial,baseline",
			SortOrder:       1,
			ActivitiesJSON:  `[{"name":"Review History","duration":15,"notes":"Review intake forms and previous reports"},{"name":"Standardized Assessment","duration":45,"notes":"Administer age-appropriate assessments"},{"name":"Free Play Observation","duration":20,"notes":"Observe natural play behaviors"},{"name":"Parent Discussion","duration":10,"notes":"Discuss findings and next steps"}]`,
			GoalsJSON:       `[{"goal":"Complete comprehensive assessment","target":"100% of assessment items"},{"goal":"Identify 3-5 key intervention areas","target":"Prioritized list"},{"goal":"Establish baseline data","target":"Quantified measurements"}]`,
			NotesTemplate:   "Assessment Date: {date}\nChild: {child_name}\n\nStrengths Observed:\n- \n\nAreas for Development:\n- \n\nRecommendations:\n- ",
		},
		{
			Name:            "Social Skills Session",
			Description:     "Structured session focusing on social interaction and communication",
			Category:        "social",
			DurationMinutes: 60,
			Objectives:      "Practice turn-taking, improve eye contact, develop conversational skills, enhance peer interaction",
			Instructions:    "1. Warm-up activity\n2. Turn-taking games\n3. Role-play scenarios\n4. Group activity\n5. Reflection and feedback",
			Materials:       "Board games, role-play cards, timer, reward stickers",
			AgeRangeMin:     4,
			AgeRangeMax:     16,
			IsActive:        true,
			CreatedBy:       "system",
			Tags:            "social,communication,interaction,peers",
			SortOrder:       2,
			ActivitiesJSON:  `[{"name":"Greeting Circle","duration":5,"notes":"Practice greetings and eye contact"},{"name":"Turn-Taking Game","duration":20,"notes":"Board game or card game focusing on waiting"},{"name":"Social Story","duration":15,"notes":"Read and discuss social scenarios"},{"name":"Role Play","duration":15,"notes":"Practice different social situations"},{"name":"Wrap-up Discussion","duration":5,"notes":"Reflect on what was learned"}]`,
			GoalsJSON:       `[{"goal":"Maintain eye contact","target":"3+ seconds during conversation"},{"goal":"Take turns appropriately","target":"Wait for turn without prompting"},{"goal":"Initiate conversation","target":"Ask 2+ questions during session"}]`,
			NotesTemplate:   "Social Skills Session - {date}\nChild: {child_name}\n\nEye Contact: /5\nTurn-Taking: /5\nConversation: /5\n\nHighlights:\n- \n\nChallenges:\n- \n\nNext Session Focus:\n- ",
		},
		{
			Name:            "Behavioral Intervention Session",
			Description:     "Structured session for addressing challenging behaviors",
			Category:        "behavioral",
			DurationMinutes: 45,
			Objectives:      "Reduce challenging behaviors, increase positive behaviors, practice self-regulation strategies",
			Instructions:    "1. Review behavioral goals\n2. Implement intervention strategies\n3. Practice replacement behaviors\n4. Provide positive reinforcement\n5. Data collection",
			Materials:       "Visual schedules, timer, reward system materials, data collection sheets",
			AgeRangeMin:     3,
			AgeRangeMax:     15,
			IsActive:        true,
			CreatedBy:       "system",
			Tags:            "behavioral,intervention,self-regulation,positive",
			SortOrder:       3,
			ActivitiesJSON:  `[{"name":"Goal Review","duration":5,"notes":"Review behavioral targets with child"},{"name":"Skill Practice","duration":20,"notes":"Practice replacement behaviors"},{"name":"Regulation Activity","duration":15,"notes":"Deep breathing, mindfulness, or movement"},{"name":"Reinforcement","duration":5,"notes":"Provide earned rewards and feedback"}]`,
			GoalsJSON:       `[{"goal":"Reduce target behavior","target":"<3 occurrences per session"},{"goal":"Use replacement behavior","target":"80% of opportunities"},{"goal":"Complete regulation activity","target":"Without resistance"}]`,
			NotesTemplate:   "Behavioral Session - {date}\nChild: {child_name}\n\nTarget Behaviors Today:\n- Behavior 1: [frequency]\n- Behavior 2: [frequency]\n\nReplacement Behaviors Used:\n- \n\nRegulation Strategies:\n- \n\nRewards Earned:\n- ",
		},
	}

	for _, template := range sessionTemplates {
		// Check if template already exists
		var existing model.SessionTemplate
		if err := db.Where("name = ?", template.Name).First(&existing).Error; err == nil {
			// Already exists, skip
			continue
		}
		if err := db.Create(&template).Error; err != nil {
			return err
		}
	}

	return nil
}

func migration009Down(db *gorm.DB) error {
	// Drop indexes
	if err := db.Exec("DROP INDEX IF EXISTS idx_session_templates_category").Error; err != nil {
		return err
	}
	if err := db.Exec("DROP INDEX IF EXISTS idx_session_templates_is_active").Error; err != nil {
		return err
	}
	if err := db.Exec("DROP INDEX IF EXISTS idx_session_templates_sort_order").Error; err != nil {
		return err
	}

	// Drop table
	if err := db.Migrator().DropTable(&model.SessionTemplate{}); err != nil {
		return err
	}

	return nil
}
