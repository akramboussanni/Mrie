package model

import "time"

// @Description Cache entry for prayer times
type PrayerTimesCache struct {
	MasjidID  string
	Month     int
	Day       int
	Data      *PrayerTimesData
	ExpiresAt time.Time
}

// @Description Cache key for prayer times
type PrayerTimesCacheKey struct {
	MasjidID string
	Month    int
	Day      int
}
