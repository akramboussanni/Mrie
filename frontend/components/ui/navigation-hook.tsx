import { useUnload } from './page-wrapper';

export function useNavigation() {
  const { triggerUnload, isUnloading } = useUnload();

  const navigateTo = (path: string) => {
    triggerUnload(path);
  };

  const goToHome = () => navigateTo('/');
  const goToLogin = () => navigateTo('/login');
  const goToRegister = () => navigateTo('/register');
  const goToDashboard = () => navigateTo('/dashboard');
  const goToSettings = () => navigateTo('/settings');
  const goToAdmin = () => navigateTo('/admin');
  const goToForgotPassword = () => navigateTo('/forgot-password');

  return {
    navigateTo,
    goToHome,
    goToLogin,
    goToRegister,
    goToDashboard,
    goToSettings,
    goToAdmin,
    goToForgotPassword,
    isUnloading
  };
} 