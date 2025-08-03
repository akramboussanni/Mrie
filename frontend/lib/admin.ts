import { config, getApiUrl } from './config';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  created_at?: number;
}

export interface UpdateUserRoleRequest {
  email: string;
  role: string;
}

export interface UpdateUserPermissionsRequest {
  email: string;
  permissions: string[];
}

export interface UsersResponse {
  users: User[];
}

export interface UserResponse {
  user: User;
}

class AdminService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // for cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'unknown error' }));
      throw new Error(errorData.error || `http error ${response.status}`);
    }

    return response.json();
  }

  async getUsers(): Promise<User[]> {
    const response = await this.makeRequest<UsersResponse>(config.generic.users);
    return response.users || [];
  }

  async getUser(userId: number): Promise<User> {
    const response = await this.makeRequest<UserResponse>(`${config.generic.users}/${userId}`);
    return response.user;
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await this.makeRequest<UserResponse>(config.generic.users, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.user;
  }

  async updateUserRole(data: UpdateUserRoleRequest): Promise<void> {
    await this.makeRequest(config.generic.permissions, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserPermissions(data: UpdateUserPermissionsRequest): Promise<void> {
    await this.makeRequest(`${config.generic.permissions}/user`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const adminService = new AdminService(); 