package repo

import (
	"context"
	"fmt"

	"github.com/akramboussanni/gocode/internal/model"
	"github.com/jmoiron/sqlx"
)

type AppSettingsRepo struct {
	Columns
	db *sqlx.DB
}

func NewAppSettingsRepo(db *sqlx.DB) *AppSettingsRepo {
	repo := &AppSettingsRepo{db: db}
	repo.Columns = ExtractColumns[model.AppSetting]()
	return repo
}

func (r *AppSettingsRepo) GetSetting(ctx context.Context, key string) (*model.AppSetting, error) {
	var setting model.AppSetting
	query := fmt.Sprintf("SELECT %s FROM app_settings WHERE setting_key = $1", r.AllRaw)
	err := r.db.GetContext(ctx, &setting, query, key)
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

func (r *AppSettingsRepo) GetAllSettings(ctx context.Context) ([]model.AppSetting, error) {
	var settings []model.AppSetting
	query := fmt.Sprintf("SELECT %s FROM app_settings ORDER BY setting_key", r.AllRaw)
	err := r.db.SelectContext(ctx, &settings, query)
	return settings, err
}

func (r *AppSettingsRepo) SetSetting(ctx context.Context, key, value string) error {
	// Try to update first, if not found then insert
	query := `
		INSERT INTO app_settings (setting_key, setting_value) 
		VALUES ($1, $2) 
		ON CONFLICT (setting_key) 
		DO UPDATE SET setting_value = $2
	`
	_, err := r.db.ExecContext(ctx, query, key, value)
	return err
}

func (r *AppSettingsRepo) DeleteSetting(ctx context.Context, key string) error {
	query := "DELETE FROM app_settings WHERE setting_key = $1"
	_, err := r.db.ExecContext(ctx, query, key)
	return err
}
