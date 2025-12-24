'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      // For now, we manually set the user since we don't have a /me endpoint yet
      // In the future, we will decode the token or fetch user data here
      setUser({ email: 'user@example.com' }); 
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, email: string) => {
    Cookies.set('token', token, { expires: 1 }); // Expires in 1 day
    setUser({ email });
    router.push('/'); // Redirect to dashboard/home
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};