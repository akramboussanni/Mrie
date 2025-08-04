import { config, getApiUrl } from './config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  url: string;
}

export interface EmailRequest {
  email: string;
  url?: string;
}

export interface TokenRequest {
  token: string;
  url?: string;
}

export interface PasswordResetRequest {
  token: string;
  new_password: string;
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: number;
}

export interface LoginResponse {
  message: string;
}

class AuthService {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // for cookies
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // For 401 errors, just throw immediately without retry logic
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({ error: 'unauthorized' }));
          throw new Error(errorData.error || 'unauthorized');
        }
        
        const errorData = await response.json().catch(() => ({ error: 'unknown error' }));
        throw new Error(errorData.error || `http error ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  private startRefreshTimer() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Refresh token 5 minutes before it expires (55 minutes for 1-hour token)
    this.refreshTimer = setTimeout(async () => {
      if (!this.isRefreshing) {
        try {
          this.isRefreshing = true;
          await this.refresh();
        } catch (error) {
          console.error('Failed to refresh token:', error);
        } finally {
          this.isRefreshing = false;
        }
      }
    }, 55 * 60 * 1000); // 55 minutes
  }

  private stopRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>(config.auth.login, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Start automatic refresh after successful login
    this.startRefreshTimer();
    
    return response;
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>(config.auth.register, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    await this.makeRequest(config.auth.logout, {
      method: 'POST',
    });
    this.stopRefreshTimer();
  }

  async logoutAll(): Promise<void> {
    await this.makeRequest(config.auth.logoutAll, {
      method: 'POST',
    });
    this.stopRefreshTimer();
  }

  async refresh(): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>(config.auth.refresh, {
      method: 'POST',
    });
    
    // Restart the refresh timer after successful refresh
    this.startRefreshTimer();
    
    return response;
  }

  async forgotPassword(data: EmailRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>(config.auth.forgotPassword, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: PasswordResetRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>(config.auth.resetPassword, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmEmail(data: TokenRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>(config.auth.confirmEmail, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendConfirmation(data: EmailRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>(config.auth.resendConfirmation, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: PasswordChangeRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>(config.auth.changePassword, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<User> {
    return this.makeRequest<User>(config.auth.profile, {
      method: 'GET',
    });
  }

  async checkPermission(permission: string): Promise<boolean> {
    try {
      return await this.makeRequest<boolean>(`${config.generic.permissions}/${permission}`, {
        method: 'GET',
      });
    } catch {
      return false;
    }
  }

  // Method to manually start refresh timer (useful for initial load)
  startAutoRefresh() {
    this.startRefreshTimer();
  }

  // Method to stop refresh timer
  stopAutoRefresh() {
    this.stopRefreshTimer();
  }
}

export const authService = new AuthService(); 