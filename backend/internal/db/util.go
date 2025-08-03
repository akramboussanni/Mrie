package db

import (
	"context"
	"log"
	"time"

	"github.com/akramboussanni/gocode/config"
	"github.com/akramboussanni/gocode/internal/model"
	"github.com/akramboussanni/gocode/internal/utils"
)

// CreateDefaultAdmin creates a default admin user if one doesn't exist
// This function is database driver agnostic and uses the DB interface
func CreateDefaultAdmin() {
	ctx := context.Background()

	// Check if admin user already exists
	var exists bool
	err := DB.GetContext(ctx, &exists, "SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)", config.App.DefaultAdminEmail)
	if err != nil {
		log.Printf("error checking for existing admin user: %v", err)
		return
	}

	if exists {
		log.Println("default admin user already exists")
		return
	}

	// Create default admin user
	passwordHash, err := utils.HashPassword(config.App.DefaultAdminPassword)
	if err != nil {
		log.Printf("error hashing admin password: %v", err)
		return
	}

	adminUser := &model.User{
		ID:             utils.GenerateSnowflakeID(),
		Username:       config.App.DefaultAdminUsername,
		Email:          config.App.DefaultAdminEmail,
		PasswordHash:   passwordHash,
		Role:           "admin",
		CreatedAt:      time.Now().UTC().Unix(),
		EmailConfirmed: true, // Admin user is pre-confirmed
	}

	// Use parameterized query that works with both SQLite and PostgreSQL
	query := `INSERT INTO users (id, username, email, password_hash, user_role, created_at, email_confirmed, email_confirm_token, email_confirm_issuedat, password_reset_token, password_reset_issuedat, jwt_session_id) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err = DB.ExecContext(ctx, query,
		adminUser.ID,
		adminUser.Username,
		adminUser.Email,
		adminUser.PasswordHash,
		adminUser.Role,
		adminUser.CreatedAt,
		adminUser.EmailConfirmed,
		"", // email_confirm_token
		0,  // email_confirm_issuedat
		"", // password_reset_token
		0,  // password_reset_issuedat
		0,  // jwt_session_id
	)

	if err != nil {
		log.Printf("error creating default admin user: %v", err)
		return
	}

	log.Println("default admin user created successfully")
	log.Printf("email: %s", config.App.DefaultAdminEmail)
	log.Printf("password: %s", config.App.DefaultAdminPassword)
}
