import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminInfo, getCurrentAdmin, isAuthenticated } from '../services/authService';

interface AuthContextType {
  admin: AdminInfo | null;
  loading: boolean;
  login: (admin: AdminInfo) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          const adminData = await getCurrentAdmin();
          setAdmin(adminData);
        } catch (error) {
          console.error('Failed to fetch admin info:', error);
          // 토큰이 유효하지 않으면 제거
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (adminData: AdminInfo) => {
    setAdmin(adminData);
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const value: AuthContextType = {
    admin,
    loading,
    login,
    logout,
    isAuthenticated: !!admin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
