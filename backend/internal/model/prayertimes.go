package model

import (
	"encoding/json"
	"time"
)

// @Description Prayer times data model
type PrayerTimesData struct {
	Fajr     time.Time `json:"fajr" example:"2024-01-01T05:30:00Z"`
	Shuruq   time.Time `json:"shuruq" example:"2024-01-01T07:15:00Z"`
	Dhuhr    time.Time `json:"dhuhr" example:"2024-01-01T12:30:00Z"`
	Asr      time.Time `json:"asr" example:"2024-01-01T15:45:00Z"`
	Maghreb  time.Time `json:"maghreb" example:"2024-01-01T17:30:00Z"`
	Isha     time.Time `json:"isha" example:"2024-01-01T19:00:00Z"`
	Timezone string    `json:"timezone" example:"Europe/London"`
}

// MarshalJSON customizes the JSON marshaling to convert times to UTC
func (p *PrayerTimesData) MarshalJSON() ([]byte, error) {
	type Alias PrayerTimesData
	return json.Marshal(&struct {
		*Alias
		Fajr    string `json:"fajr"`
		Shuruq  string `json:"shuruq"`
		Dhuhr   string `json:"dhuhr"`
		Asr     string `json:"asr"`
		Maghreb string `json:"maghreb"`
		Isha    string `json:"isha"`
	}{
		Alias:   (*Alias)(p),
		Fajr:    p.Fajr.UTC().Format("2006-01-02T15:04:05Z"),
		Shuruq:  p.Shuruq.UTC().Format("2006-01-02T15:04:05Z"),
		Dhuhr:   p.Dhuhr.UTC().Format("2006-01-02T15:04:05Z"),
		Asr:     p.Asr.UTC().Format("2006-01-02T15:04:05Z"),
		Maghreb: p.Maghreb.UTC().Format("2006-01-02T15:04:05Z"),
		Isha:    p.Isha.UTC().Format("2006-01-02T15:04:05Z"),
	})
}

// @Description Default masjid request model
type DefaultMasjidRequest struct {
	MasjidID string `json:"masjid_id" example:"masjid123" binding:"required"`
}

// @Description Mosque information model
type MosqueInfo struct {
	ID       string `json:"id" example:"mosquee-de-paris"`
	Name     string `json:"name" example:"Grande Mosquée de Paris"`
	Country  string `json:"country" example:"France"`
	City     string `json:"city" example:"Paris"`
	Timezone string `json:"timezone,omitempty" example:"Europe/Paris"`
}

// @Description Mosque validation response model
type MosqueValidationResponse struct {
	Valid bool   `json:"valid" example:"true"`
	Error string `json:"error,omitempty" example:"masjid not found"`
}
