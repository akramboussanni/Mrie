package model

// @Description Application settings model using key-value pattern
type AppSetting struct {
	ID    int64  `db:"id" safe:"true" json:"id" example:"1"`
	Key   string `db:"setting_key" safe:"true" json:"key" example:"default_masjid"`
	Value string `db:"setting_value" safe:"true" json:"value" example:"masjid123"`
}
