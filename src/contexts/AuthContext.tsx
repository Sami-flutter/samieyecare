import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/clinic';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: Record<string, User & { password: string }> = {
  'reception@clinic.com': {
    id: '1',
    name: 'Sarah Johnson',
    email: 'reception@clinic.com',
    role: 'reception',
    password: 'demo123',
  },
  'measurement@clinic.com': {
    id: '2',
    name: 'Mike Chen',
    email: 'measurement@clinic.com',
    role: 'eye_measurement',
    password: 'demo123',
  },
  'doctor@clinic.com': {
    id: '3',
    name: 'Dr. Emily Watson',
    email: 'doctor@clinic.com',
    role: 'doctor',
    password: 'demo123',
  },
  'pharmacy@clinic.com': {
    id: '4',
    name: 'James Miller',
    email: 'pharmacy@clinic.com',
    role: 'pharmacy',
    password: 'demo123',
  },
  'admin@clinic.com': {
    id: '5',
    name: 'Admin User',
    email: 'admin@clinic.com',
    role: 'admin',
    password: 'demo123',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('clinic_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      const { password: _, ...userWithoutPassword } = mockUser;
      setUser(userWithoutPassword);
      localStorage.setItem('clinic_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('clinic_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
