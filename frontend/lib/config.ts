export const config = {
  // backend api configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9520',
    timeout: 10000, // 10 seconds
  },
  
  // authentication endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    confirmEmail: '/auth/confirm-email',
    resendConfirmation: '/auth/resend-confirmation',
    changePassword: '/auth/change-password',
    profile: '/auth/me',
  },
  
  // generic endpoints
  generic: {
    users: '/generic/users',
    permissions: '/generic/permissions',
    settings: '/generic/settings',
  },
  
  // prayer times endpoints
  prayertimes: {
    base: '/prayertimes',
    default: '/prayertimes/default',
    cache: '/prayertimes/cache/stats',
    defaultMasjid: '/prayertimes/default-masjid',
  }
};

export const getApiUrl = (endpoint: string) => `${config.api.baseUrl}${endpoint}`; 