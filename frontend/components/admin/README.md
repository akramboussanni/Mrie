# Admin Components

This directory contains modular components for the admin panel functionality. The original large admin page has been split into smaller, more maintainable components.

## Components

### AdminHeader
- **Purpose**: Header section with navigation and create user button
- **Props**: 
  - `onBack`: Function to handle back navigation
  - `onCreateUser`: Function to toggle create user form
  - `showCreateForm`: Boolean to show/hide create form
  - `isLoading`: Boolean for loading state
  - `isUnloading`: Boolean for unloading state

### CreateUserForm
- **Purpose**: Form for creating new users
- **Props**:
  - `onUserCreated`: Callback when user is successfully created
  - `onCancel`: Callback to cancel form

### UsersList
- **Purpose**: Displays list of users with search functionality
- **Props**:
  - `onRoleManagerOpen`: Callback to open role manager for a user
  - `onPermissionManagerOpen`: Callback to open permission manager for a user

### UserPermissionsCard
- **Purpose**: Displays current user's permissions
- **Props**:
  - `userRole`: String representing the user's role

### PermissionManagerDialog
- **Purpose**: Dialog for managing user permissions
- **Props**:
  - `isOpen`: Boolean to control dialog visibility
  - `onClose`: Callback to close dialog
  - `selectedUser`: User object to manage permissions for
  - `onPermissionsUpdated`: Callback when permissions are updated

### RoleManagerDialog
- **Purpose**: Dialog for managing user roles
- **Props**:
  - `isOpen`: Boolean to control dialog visibility
  - `onClose`: Callback to close dialog
  - `selectedUser`: User object to manage role for
  - `onRoleUpdated`: Callback when role is updated

### AppSettings
- **Purpose**: App settings section with mosque management
- **Props**: None (self-contained)

## Usage

```tsx
import {
  AdminHeader,
  CreateUserForm,
  UsersList,
  UserPermissionsCard,
  PermissionManagerDialog,
  RoleManagerDialog,
  AppSettings
} from "@/components/admin";

// Use in your admin page
<AdminHeader
  onBack={goBack}
  onCreateUser={handleCreateUser}
  showCreateForm={showCreateForm}
  isLoading={false}
  isUnloading={isUnloading}
/>

{showCreateForm && (
  <CreateUserForm
    onUserCreated={handleUserCreated}
    onCancel={() => setShowCreateForm(false)}
  />
)}

<UsersList
  onRoleManagerOpen={handleRoleManagerOpen}
  onPermissionManagerOpen={handlePermissionManagerOpen}
/>

<UserPermissionsCard userRole={user?.role || ''} />

<AppSettings />
```

## Benefits of This Structure

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Maintainability**: Easier to maintain and debug individual components
4. **Testability**: Each component can be tested independently
5. **Readability**: Code is more organized and easier to understand

## State Management

Each component manages its own local state. For shared state that needs to be accessed by multiple components, consider using:
- React Context
- State management libraries (Zustand, Redux, etc.)
- Prop drilling (for simple cases)

## Styling

All components use the existing design system with:
- Cottage theme colors (`cottage-brown`, `cottage-cream`, `cottage-warm`)
- Consistent spacing and typography
- Responsive design patterns
- Hover effects and transitions 