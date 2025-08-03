package model

// @Description Mosque model for database storage
type Mosque struct {
	ID        string `json:"id" db:"id"`
	Name      string `json:"name" db:"name"`
	Country   string `json:"country" db:"country"`
	City      string `json:"city" db:"city"`
	Timezone  string `json:"timezone" db:"timezone"`
	CreatedAt int64  `json:"created_at" db:"created_at"`
	UpdatedAt int64  `json:"updated_at" db:"updated_at"`
}

// @Description Mosque creation request
type CreateMosqueRequest struct {
	ID       string `json:"id" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Country  string `json:"country" binding:"required"`
	City     string `json:"city" binding:"required"`
	Timezone string `json:"timezone"`
}

// @Description Mosque update request
type UpdateMosqueRequest struct {
	Name     string `json:"name"`
	Country  string `json:"country"`
	City     string `json:"city"`
	Timezone string `json:"timezone"`
}
