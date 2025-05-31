import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

export interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const defaultState: AuthState = {
  isLoggedIn: false,
  username: null,
  loading: true,
  logout: async () => {}
};

const AuthContext = createContext<AuthState>(defaultState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'logout'>>(defaultState);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (res.ok) {
          const data = await res.json();
          setState({
            isLoggedIn: true,
            username: data.username,
            loading: false
          });
        } else {
          setState({
            isLoggedIn: false,
            username: null,
            loading: false
          });
          
          if (router.pathname !== '/auth' && !router.pathname.startsWith('/_')) {
            router.push('/auth');
          }
        }
      } catch (error) {
        setState({
          isLoggedIn: false,
          username: null,
          loading: false
        });
        
        if (router.pathname !== '/auth' && !router.pathname.startsWith('/_')) {
          router.push('/auth');
        }
      }
    };

    checkAuth();
  }, [router.pathname]);

  const logout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      
      if (res.ok) {
        setState({
          isLoggedIn: false,
          username: null,
          loading: false
        });
        router.push('/auth');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}