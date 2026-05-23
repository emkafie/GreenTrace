import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // { id, username, role }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token

  // On mount, check localStorage for an existing session
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    // Validate the token by calling /api/auth/me
    let ignore = false;
    const validate = async () => {
      try {
        const userData = await getMe(storedToken);
        if (!ignore) {
          setToken(storedToken);
          setUser(userData);
        }
      } catch {
        // Token invalid or expired — clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    validate();

    return () => { ignore = true; };
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
