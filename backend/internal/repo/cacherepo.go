package repo

import (
	"sync"
	"time"

	"github.com/akramboussanni/gocode/internal/model"
)

type CacheRepo struct {
	prayerTimesCache map[model.PrayerTimesCacheKey]*model.PrayerTimesCache
	mutex            sync.RWMutex
	cleanupInterval  time.Duration
	lastCleanup      time.Time
}

func NewCacheRepo() *CacheRepo {
	cr := &CacheRepo{
		prayerTimesCache: make(map[model.PrayerTimesCacheKey]*model.PrayerTimesCache),
		cleanupInterval:  5 * time.Minute, // Cleanup every 5 minutes
		lastCleanup:      time.Now(),
	}

	// Start cleanup goroutine
	go cr.cleanupRoutine()

	return cr
}

func (cr *CacheRepo) GetPrayerTimes(key model.PrayerTimesCacheKey) (*model.PrayerTimesData, bool) {
	cr.mutex.RLock()
	defer cr.mutex.RUnlock()

	if entry, exists := cr.prayerTimesCache[key]; exists {
		if time.Now().Before(entry.ExpiresAt) {
			return entry.Data, true
		}
		// Entry expired, remove it
		delete(cr.prayerTimesCache, key)
	}
	return nil, false
}

func (cr *CacheRepo) SetPrayerTimes(key model.PrayerTimesCacheKey, data *model.PrayerTimesData, ttl time.Duration) {
	cr.mutex.Lock()
	defer cr.mutex.Unlock()

	cr.prayerTimesCache[key] = &model.PrayerTimesCache{
		MasjidID:  key.MasjidID,
		Month:     key.Month,
		Day:       key.Day,
		Data:      data,
		ExpiresAt: time.Now().Add(ttl),
	}
}

func (cr *CacheRepo) cleanupRoutine() {
	ticker := time.NewTicker(cr.cleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		cr.cleanup()
	}
}

func (cr *CacheRepo) cleanup() {
	cr.mutex.Lock()
	defer cr.mutex.Unlock()

	now := time.Now()
	for key, entry := range cr.prayerTimesCache {
		if now.After(entry.ExpiresAt) {
			delete(cr.prayerTimesCache, key)
		}
	}
	cr.lastCleanup = now
}

func (cr *CacheRepo) GetStats() map[string]interface{} {
	cr.mutex.RLock()
	defer cr.mutex.RUnlock()

	return map[string]interface{}{
		"cache_size":       len(cr.prayerTimesCache),
		"last_cleanup":     cr.lastCleanup,
		"cleanup_interval": cr.cleanupInterval,
	}
}
