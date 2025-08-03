export enum Permission {
  // User permissions
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_PRAYER_TIMES = 'view_prayer_times',
  VIEW_SETTINGS = 'view_settings',
  CHANGE_PASSWORD = 'change_password',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_MOSQUES = 'manage_mosques',
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_ADMIN_PANEL = 'view_admin_panel',
  
  // System permissions
  ACCESS_API = 'access_api',
  VIEW_LOGS = 'view_logs',
  MANAGE_SYSTEM = 'manage_system'
}

export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  ADMIN = 'admin'
}

// Permission mappings for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PRAYER_TIMES
  ],
  [UserRole.USER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PRAYER_TIMES,
    Permission.VIEW_SETTINGS,
    Permission.CHANGE_PASSWORD,
    Permission.ACCESS_API
  ],
  [UserRole.ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PRAYER_TIMES,
    Permission.VIEW_SETTINGS,
    Permission.CHANGE_PASSWORD,
    Permission.ACCESS_API,
    Permission.MANAGE_USERS,
    Permission.MANAGE_MOSQUES,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_ADMIN_PANEL,
    Permission.VIEW_LOGS,
    Permission.MANAGE_SYSTEM
  ]
};

// Helper functions
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] ?? [];
}

export function canAccessAdminPanel(userRole: UserRole): boolean {
  return hasPermission(userRole, Permission.VIEW_ADMIN_PANEL);
}

export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, Permission.MANAGE_USERS);
}

export function canManageMosques(userRole: UserRole): boolean {
  return hasPermission(userRole, Permission.MANAGE_MOSQUES);
} 