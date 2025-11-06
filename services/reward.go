package services

import (
	"childSessions/model"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type RewardService struct {
	db *gorm.DB
}

func NewRewardService(db *gorm.DB) *RewardService {
	return &RewardService{db: db}
}

// GiveReward gives a reward to a child
func (s *RewardService) GiveReward(childID uint, sessionID *uint, rewardType string, value int, notes string) (*model.Reward, error) {
	if rewardType == "" {
		return nil, errors.New("tipe reward harus diisi")
	}

	reward := &model.Reward{
		ChildID:   childID,
		SessionID: sessionID,
		Type:      rewardType,
		Value:     value,
		Timestamp: time.Now(),
		Notes:     notes,
	}

	if err := s.db.Create(reward).Error; err != nil {
		return nil, fmt.Errorf("gagal memberikan reward: %w", err)
	}

	// Load relationships
	if err := s.db.Preload("Child").First(reward, reward.ID).Error; err != nil {
		return nil, fmt.Errorf("gagal memuat data reward: %w", err)
	}

	return reward, nil
}

// GetRewardsByChild retrieves all rewards for a specific child
func (s *RewardService) GetRewardsByChild(childID uint) ([]model.Reward, error) {
	var rewards []model.Reward
	if err := s.db.Where("child_id = ?", childID).
		Preload("Session").
		Order("timestamp DESC").
		Find(&rewards).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil reward: %w", err)
	}
	return rewards, nil
}

// GetRewardsBySession retrieves all rewards for a specific session
func (s *RewardService) GetRewardsBySession(sessionID uint) ([]model.Reward, error) {
	var rewards []model.Reward
	if err := s.db.Where("session_id = ?", sessionID).
		Preload("Child").
		Order("timestamp DESC").
		Find(&rewards).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil reward sesi: %w", err)
	}
	return rewards, nil
}

// GetRewardStatistics calculates reward statistics for a child
func (s *RewardService) GetRewardStatistics(childID uint) (map[string]interface{}, error) {
	// Count total rewards
	var totalRewards int64
	if err := s.db.Model(&model.Reward{}).Where("child_id = ?", childID).Count(&totalRewards).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung total reward: %w", err)
	}

	// Count rewards by type
	rows, err := s.db.Model(&model.Reward{}).
		Select("type, COUNT(*) as count, SUM(value) as total_value").
		Where("child_id = ?", childID).
		Group("type").
		Rows()
	if err != nil {
		return nil, fmt.Errorf("gagal menghitung reward per tipe: %w", err)
	}
	defer rows.Close()

	rewardsByType := make(map[string]map[string]int64)
	for rows.Next() {
		var rewardType string
		var count, totalValue int64
		if err := rows.Scan(&rewardType, &count, &totalValue); err != nil {
			continue
		}
		rewardsByType[rewardType] = map[string]int64{
			"count":       count,
			"total_value": totalValue,
		}
	}

	// Get recent rewards (last 30 days)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	var recentRewards int64
	s.db.Model(&model.Reward{}).
		Where("child_id = ? AND timestamp >= ?", childID, thirtyDaysAgo).
		Count(&recentRewards)

	statistics := map[string]interface{}{
		"child_id":        childID,
		"total_rewards":   totalRewards,
		"rewards_by_type": rewardsByType,
		"recent_rewards":  recentRewards,
		"generated_at":    time.Now(),
	}

	return statistics, nil
}

// DeleteReward removes a reward record
func (s *RewardService) DeleteReward(rewardID uint) error {
	if err := s.db.Delete(&model.Reward{}, rewardID).Error; err != nil {
		return fmt.Errorf("gagal menghapus reward: %w", err)
	}
	return nil
}

// GetAllRewardTypes retrieves all reward types
func (s *RewardService) GetAllRewardTypes() ([]model.RewardType, error) {
	var rewardTypes []model.RewardType
	if err := s.db.Where("is_active = ?", true).Order("sort_order ASC").Find(&rewardTypes).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil tipe reward: %w", err)
	}
	return rewardTypes, nil
}

// GetRewardTypeByID retrieves a specific reward type by ID
func (s *RewardService) GetRewardTypeByID(id uint) (*model.RewardType, error) {
	var rewardType model.RewardType
	if err := s.db.First(&rewardType, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("tipe reward tidak ditemukan")
		}
		return nil, fmt.Errorf("gagal mengambil tipe reward: %w", err)
	}
	return &rewardType, nil
}

// GiveRewardWithType gives a reward using a reward type
func (s *RewardService) GiveRewardWithType(childID uint, sessionID *uint, rewardTypeID uint, notes string) (*model.Reward, error) {
	// Get reward type to use default value
	rewardType, err := s.GetRewardTypeByID(rewardTypeID)
	if err != nil {
		return nil, err
	}

	reward := &model.Reward{
		ChildID:      childID,
		SessionID:    sessionID,
		RewardTypeID: &rewardTypeID,
		Type:         rewardType.Name, // Keep for backward compatibility
		Value:        rewardType.DefaultValue,
		Timestamp:    time.Now(),
		Notes:        notes,
	}

	if err := s.db.Create(reward).Error; err != nil {
		return nil, fmt.Errorf("gagal memberikan reward: %w", err)
	}

	// Load relationships
	if err := s.db.Preload("Child").Preload("RewardType").First(reward, reward.ID).Error; err != nil {
		return nil, fmt.Errorf("gagal memuat data reward: %w", err)
	}

	return reward, nil
}
