import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; url: string }) => Promise<void>;
  forgotPassword: (data: { email: string; url: string }) => Promise<void>;
  resetPassword: (data: { token: string; new_password: string }) => Promise<void>;
  confirmEmail: (data: { token: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await authService.getProfile();
      setUser(userData);
      // Start auto-refresh when user is authenticated
      authService.startAutoRefresh();
    } catch (error) {
      setUser(null);
      authService.stopAutoRefresh();
    }
  };

  const login = async (email: string, password: string) => {
    await authService.login({ email, password });
    await refreshUser();
  };

  const register = async (data: { username: string; email: string; password: string; url: string }) => {
    await authService.register(data);
  };

  const forgotPassword = async (data: { email: string; url: string }) => {
    await authService.forgotPassword(data);
  };

  const resetPassword = async (data: { token: string; new_password: string }) => {
    await authService.resetPassword(data);
  };

  const confirmEmail = async (data: { token: string }) => {
    await authService.confirmEmail(data);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    }
    setUser(null);
    authService.stopAutoRefresh();
  };

  // Check authentication status on mount and after page refresh
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await refreshUser();
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    forgotPassword,
    resetPassword,
    confirmEmail,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 