'use client'

import { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

interface UnloadContextType {
  triggerUnload: (path: string) => void;
  isUnloading: boolean;
}

const UnloadContext = createContext<UnloadContextType | null>(null);

export function useUnload() {
  const context = useContext(UnloadContext);
  if (!context) {
    throw new Error('useUnload must be used within a PageWrapper');
  }
  return context;
}

export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isUnloading, setIsUnloading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsPageLoaded(false);
    setTimeout(() => {
      setIsPageLoaded(true);
    }, 300);
  }, []);

  const triggerUnload = (path: string) => {
    setIsUnloading(true);
    setTimeout(() => {
      router.push(path);
    }, 300); // Shorter delay for better UX
  };

  return (
    <UnloadContext.Provider value={{ triggerUnload, isUnloading }}>
      <div className={`min-h-screen bg-background p-6 ${className}`}>
        <div className={`transition-all duration-300 ease-out ${
          isPageLoaded && !isUnloading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {children}
        </div>
      </div>
    </UnloadContext.Provider>
  );
} 