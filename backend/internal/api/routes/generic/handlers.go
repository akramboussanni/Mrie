package generic

import (
	"net/http"
	"strconv"
	"time"

	"github.com/akramboussanni/gocode/internal/api"
	"github.com/akramboussanni/gocode/internal/applog"
	"github.com/akramboussanni/gocode/internal/model"
	"github.com/akramboussanni/gocode/internal/utils"
	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

// @Summary Get user by ID
// @Description Retrieve user information by ID (admin only)
// @Tags Users
// @Accept json
// @Produce json
// @Security CookieAuth
// @Param id path string true "User ID"
// @Success 200 {string} string "User email"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 404 {object} api.ErrorResponse "User not found"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Summary Get all users
// @Description Retrieve all users (admin only)
// @Tags Users
// @Accept json
// @Produce json
// @Security CookieAuth
// @Success 200 {object} map[string][]model.User "List of users"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Router /generic/users [get]
func (gr *GenericRouter) HandleGetAllUsers(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	// Check if user has admin role
	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	// Get all users from the database
	users, err := gr.UserRepo.GetAllUsers(r.Context())
	if err != nil {
		applog.Error("Failed to get all users", "error", err)
		api.WriteInternalError(w)
		return
	}

	// Strip unsafe fields from all users
	for _, user := range users {
		utils.StripUnsafeFields(user)
	}

	api.WriteJSON(w, http.StatusOK, map[string][]*model.User{"users": users})
}

// @Summary Get user by ID
// @Description Retrieve user information by ID (admin only)
// @Tags Users
// @Accept json
// @Produce json
// @Security CookieAuth
// @Param id path string true "User ID"
// @Success 200 {string} string "User email"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 404 {object} api.ErrorResponse "User not found"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Router /generic/users/{id} [get]
func (gr *GenericRouter) HandleGetUser(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	// Check if user has admin role
	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	userID := chi.URLParam(r, "id")
	if userID == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "User ID is required")
		return
	}

	id, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Invalid user ID")
		return
	}

	foundUser, err := gr.UserRepo.GetUserByIDSafe(r.Context(), id)
	if err != nil {
		applog.Error("Failed to get user", "error", err)
		api.WriteMessage(w, http.StatusNotFound, "error", "User not found")
		return
	}

	utils.StripUnsafeFields(foundUser)
	api.WriteJSON(w, http.StatusOK, foundUser.Email)
}

// @Summary Create new user
// @Description Create a new user account (admin only)
// @Tags Users
// @Accept json
// @Produce json
// @Security CookieAuth
// @Param payload body model.AccountCreationPayload true "User creation data"
// @Success 201 {object} api.SuccessResponse "User created successfully"
// @Failure 400 {object} api.ErrorResponse "Invalid request data"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 409 {object} api.ErrorResponse "User already exists"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Router /generic/users [post]
func (gr *GenericRouter) HandleCreateUser(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	// Check if user has admin role
	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	payload, err := api.DecodeJSON[model.AccountCreationPayload](w, r)
	if err != nil {
		return
	}

	// Check if user already exists by email
	exists, err := gr.UserRepo.DuplicateEmail(r.Context(), payload.Email)
	if err != nil {
		applog.Error("Failed to check email existence", "error", err)
		api.WriteInternalError(w)
		return
	}
	if exists {
		api.WriteMessage(w, http.StatusConflict, "error", "User with this email already exists")
		return
	}

	// Check if username already exists
	usernameExists, err := gr.UserRepo.DuplicateName(r.Context(), payload.Username)
	if err != nil {
		applog.Error("Failed to check username existence", "error", err)
		api.WriteInternalError(w)
		return
	}
	if usernameExists {
		api.WriteMessage(w, http.StatusConflict, "error", "User with this username already exists")
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		applog.Error("Failed to hash password", "error", err)
		api.WriteInternalError(w)
		return
	}

	// Set default role if not provided
	if payload.Role == "" {
		payload.Role = "user"
	}

	// Create new user
	newUser := &model.User{
		Username:     payload.Username,
		Email:        payload.Email,
		PasswordHash: string(hashedPassword),
		Role:         payload.Role,
		ID:           utils.GenerateSnowflakeID(),
	}

	// Set custom creation timestamp if provided, otherwise use current time
	if payload.CreatedAt != nil {
		newUser.CreatedAt = *payload.CreatedAt
	} else {
		newUser.CreatedAt = time.Now().UTC().Unix()
	}

	err = gr.UserRepo.CreateUser(r.Context(), newUser)
	if err != nil {
		applog.Error("Failed to create user", "error", err)
		api.WriteInternalError(w)
		return
	}

	api.WriteMessage(w, http.StatusCreated, "message", "User created successfully")
}

// @Summary Delete user
// @Description Delete a user by ID (admin only)
// @Tags Users
// @Accept json
// @Produce json
// @Security CookieAuth
// @Param id path string true "User ID"
// @Success 200 {object} api.SuccessResponse "User deleted successfully"
// @Failure 400 {object} api.ErrorResponse "Invalid user ID"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 404 {object} api.ErrorResponse "User not found"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Router /generic/users/{id} [delete]
func (gr *GenericRouter) HandleDeleteUser(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	// Check if user has admin role
	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	userID := chi.URLParam(r, "id")
	if userID == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "User ID is required")
		return
	}

	id, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Invalid user ID")
		return
	}

	// Check if user exists before deleting
	_, err = gr.UserRepo.GetUserByID(r.Context(), id)
	if err != nil {
		applog.Error("Failed to get user for deletion", "error", err)
		api.WriteMessage(w, http.StatusNotFound, "error", "User not found")
		return
	}

	// Delete the user
	err = gr.UserRepo.DeleteUser(r.Context(), id)
	if err != nil {
		applog.Error("Failed to delete user", "error", err)
		api.WriteInternalError(w)
		return
	}

	api.WriteMessage(w, http.StatusOK, "message", "User deleted successfully")
}

// @Summary Check user permission
// @Description Check if current user has a specific role
// @Tags Permissions
// @Accept json
// @Produce json
// @Security CookieAuth
// @Param permission path string true "Role to check"
// @Success 200 {boolean} bool "True if user has the role"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Router /generic/permissions/{permission} [get]
func (gr *GenericRouter) HandleGetPermission(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	permission := chi.URLParam(r, "permission")
	if permission == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Permission parameter is required")
		return
	}

	hasPermission := user.Role == permission
	api.WriteJSON(w, http.StatusOK, hasPermission)
}

// @Summary Update user role
// @Description Update a user's role (admin only)
// @Tags Permissions
// @Accept json
// @Produce json
// @Security CookieAuth
// @Param request body model.AuthorizationRequest true "Role update data"
// @Success 200 {object} api.SuccessResponse "Role updated successfully"
// @Failure 400 {object} api.ErrorResponse "Invalid request data"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 404 {object} api.ErrorResponse "User not found"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Router /generic/permissions [patch]
func (gr *GenericRouter) HandleUpdatePermissions(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	// Check if user has admin role
	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	request, err := api.DecodeJSON[model.AuthorizationRequest](w, r)
	if err != nil {
		return
	}

	// Find user by email
	foundUser, err := gr.UserRepo.GetUserByEmail(r.Context(), request.Email)
	if err != nil {
		applog.Error("Failed to get user by email", "error", err)
		api.WriteMessage(w, http.StatusNotFound, "error", "User not found")
		return
	}

	// Update user role
	err = gr.UserRepo.UpdateUserRole(r.Context(), foundUser.ID, request.Role)
	if err != nil {
		applog.Error("Failed to update user role", "error", err)
		api.WriteInternalError(w)
		return
	}

	api.WriteMessage(w, http.StatusOK, "message", "Role updated successfully")
}

// @Summary Update user permissions
// @Description Update a user's permissions (admin only)
// @Tags Permissions
// @Accept json
// @Produce json
// @Security CookieAuth
// @Param request body model.PermissionUpdateRequest true "Permission update data"
// @Success 200 {object} api.SuccessResponse "Permissions updated successfully"
// @Failure 400 {object} api.ErrorResponse "Invalid request data"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 404 {object} api.ErrorResponse "User not found"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Router /generic/permissions/user [patch]
func (gr *GenericRouter) HandleUpdateUserPermissions(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	// Check if user has admin role
	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	request, err := api.DecodeJSON[model.PermissionUpdateRequest](w, r)
	if err != nil {
		return
	}

	// Find user by email
	foundUser, err := gr.UserRepo.GetUserByEmail(r.Context(), request.Email)
	if err != nil {
		applog.Error("Failed to get user by email", "error", err)
		api.WriteMessage(w, http.StatusNotFound, "error", "User not found")
		return
	}

	// For now, we'll just update the user's role based on the most restrictive permission
	// In a full implementation, you'd store permissions separately
	// This is a simplified approach
	var newRole string
	if containsPermission(request.Permissions, model.ManageSystem) {
		newRole = "admin"
	} else if containsPermission(request.Permissions, model.ViewSettings) {
		newRole = "user"
	} else {
		newRole = "guest"
	}

	// Update user role
	err = gr.UserRepo.UpdateUserRole(r.Context(), foundUser.ID, newRole)
	if err != nil {
		applog.Error("Failed to update user role", "error", err)
		api.WriteInternalError(w)
		return
	}

	api.WriteMessage(w, http.StatusOK, "message", "Permissions updated successfully")
}

func containsPermission(permissions []model.Permission, permission model.Permission) bool {
	for _, p := range permissions {
		if p == permission {
			return true
		}
	}
	return false
}

// @Summary Get all settings
// @Description Retrieve all application settings
// @Tags Settings
// @Accept json
// @Produce json
// @Security CookieAuth
// @Success 200 {array} model.AppSetting "List of all settings"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Router /generic/settings [get]
func (gr *GenericRouter) HandleGetSettings(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	// Check if user has admin role
	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	settings, err := gr.AppSettingsRepo.GetAllSettings(r.Context())
	if err != nil {
		applog.Error("Failed to get settings", "error", err)
		api.WriteInternalError(w)
		return
	}

	api.WriteJSON(w, http.StatusOK, settings)
}
