package repo

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/akramboussanni/gocode/internal/model"
	"github.com/jmoiron/sqlx"
)

type MosqueRepo struct {
	Columns
	db *sqlx.DB
}

func NewMosqueRepo(db *sqlx.DB) *MosqueRepo {
	repo := &MosqueRepo{db: db}
	repo.Columns = ExtractColumns[model.Mosque]()
	return repo
}

// GetAllMosques retrieves all mosques from the database
func (mr *MosqueRepo) GetAllMosques(ctx context.Context) ([]model.Mosque, error) {
	var mosques []model.Mosque
	query := fmt.Sprintf("SELECT %s FROM mosques ORDER BY name ASC", mr.AllRaw)
	err := mr.db.SelectContext(ctx, &mosques, query)
	return mosques, err
}

// GetMosqueByID retrieves a mosque by its ID
func (mr *MosqueRepo) GetMosqueByID(ctx context.Context, id string) (*model.Mosque, error) {
	var mosque model.Mosque
	query := fmt.Sprintf("SELECT %s FROM mosques WHERE id = $1", mr.AllRaw)
	err := mr.db.GetContext(ctx, &mosque, query, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &mosque, err
}

// CreateMosque creates a new mosque
func (mr *MosqueRepo) CreateMosque(ctx context.Context, mosque *model.Mosque) error {
	now := time.Now().UTC().Unix()
	mosque.CreatedAt = now
	mosque.UpdatedAt = now

	query := fmt.Sprintf(
		"INSERT INTO mosques (%s) VALUES (%s)",
		mr.AllRaw,
		mr.AllPrefixed,
	)
	_, err := mr.db.NamedExecContext(ctx, query, mosque)
	return err
}

// UpdateMosque updates an existing mosque
func (mr *MosqueRepo) UpdateMosque(ctx context.Context, id string, updates *model.UpdateMosqueRequest) error {
	query := `
		UPDATE mosques 
		SET name = $1, country = $2, city = $3, timezone = $4, updated_at = $5
		WHERE id = $6
	`

	now := time.Now().UTC().Unix()
	_, err := mr.db.ExecContext(ctx, query,
		updates.Name,
		updates.Country,
		updates.City,
		updates.Timezone,
		now,
		id,
	)

	return err
}

// DeleteMosque deletes a mosque by its ID
func (mr *MosqueRepo) DeleteMosque(ctx context.Context, id string) error {
	query := `DELETE FROM mosques WHERE id = $1`
	_, err := mr.db.ExecContext(ctx, query, id)
	return err
}

// MosqueExists checks if a mosque exists by its ID
func (mr *MosqueRepo) MosqueExists(ctx context.Context, id string) (bool, error) {
	var exists bool
	err := mr.db.GetContext(ctx, &exists, "SELECT EXISTS(SELECT 1 FROM mosques WHERE id = $1)", id)
	return exists, err
}
