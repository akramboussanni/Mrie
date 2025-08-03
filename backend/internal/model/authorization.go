package model

// @Description Authorization request model for role management
type AuthorizationRequest struct {
	Email string `json:"email" example:"user@example.com" binding:"required" format:"email"`
	Role  string `json:"role" example:"admin" description:"Role to assign to user"`
}

// @Description Permission update request model
type PermissionUpdateRequest struct {
	Email      string     `json:"email" example:"user@example.com" binding:"required" format:"email"`
	Permissions []Permission `json:"permissions" example:"[\"view_dashboard\",\"manage_users\"]" description:"List of permissions to assign"`
}

// @Description Account creation payload model
type AccountCreationPayload struct {
	Username  string `json:"username" example:"johndoe" binding:"required"`
	Email     string `json:"email" example:"user@example.com" binding:"required" format:"email"`
	Password  string `json:"password" example:"SecurePass123!" binding:"required" minLength:"8"`
	Role      string `json:"role" example:"user" description:"Role to assign to new user"`
	CreatedAt *int64 `json:"created_at,omitempty" example:"1640995200" description:"Custom creation timestamp (Unix timestamp)"`
}
