package model

// Permission represents a specific permission in the system
type Permission string

const (
	// User permissions
	ViewDashboard   Permission = "view_dashboard"
	ViewPrayerTimes Permission = "view_prayer_times"
	ViewSettings    Permission = "view_settings"
	ChangePassword  Permission = "change_password"

	// Admin permissions
	ManageUsers    Permission = "manage_users"
	ManageMosques  Permission = "manage_mosques"
	ManageSettings Permission = "manage_settings"
	ViewAdminPanel Permission = "view_admin_panel"

	// System permissions
	AccessAPI    Permission = "access_api"
	ViewLogs     Permission = "view_logs"
	ManageSystem Permission = "manage_system"
)

// UserRole represents the role of a user
type UserRole string

const (
	Guest       UserRole = "guest"
	RegularUser UserRole = "user"
	Admin       UserRole = "admin"
)

// RolePermissions maps each role to its permissions
var RolePermissions = map[UserRole][]Permission{
	Guest: {
		ViewDashboard,
		ViewPrayerTimes,
	},
	RegularUser: {
		ViewDashboard,
		ViewPrayerTimes,
		ViewSettings,
		ChangePassword,
		AccessAPI,
	},
	Admin: {
		ViewDashboard,
		ViewPrayerTimes,
		ViewSettings,
		ChangePassword,
		AccessAPI,
		ManageUsers,
		ManageMosques,
		ManageSettings,
		ViewAdminPanel,
		ViewLogs,
		ManageSystem,
	},
}

// HasPermission checks if a role has a specific permission
func HasPermission(role UserRole, permission Permission) bool {
	permissions, exists := RolePermissions[role]
	if !exists {
		return false
	}

	for _, p := range permissions {
		if p == permission {
			return true
		}
	}
	return false
}

// GetUserPermissions returns all permissions for a given role
func GetUserPermissions(role UserRole) []Permission {
	return RolePermissions[role]
}

// CanAccessAdminPanel checks if a role can access the admin panel
func CanAccessAdminPanel(role UserRole) bool {
	return HasPermission(role, ViewAdminPanel)
}

// CanManageUsers checks if a role can manage users
func CanManageUsers(role UserRole) bool {
	return HasPermission(role, ManageUsers)
}

// CanManageMosques checks if a role can manage mosques
func CanManageMosques(role UserRole) bool {
	return HasPermission(role, ManageMosques)
}

// CanViewSettings checks if a role can view settings
func CanViewSettings(role UserRole) bool {
	return HasPermission(role, ViewSettings)
}

// CanChangePassword checks if a role can change password
func CanChangePassword(role UserRole) bool {
	return HasPermission(role, ChangePassword)
}
