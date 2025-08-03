package model

// @Description Permission types enum
const (
	PermissionNone        int64 = 0
	PermissionAdmin       int64 = 2
	PermissionManageApps  int64 = 4
	PermissionManageUsers int64 = 8
	PermissionSignups     int64 = 16
)
