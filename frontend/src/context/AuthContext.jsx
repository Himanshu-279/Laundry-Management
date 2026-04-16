import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('laundry_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('laundry_token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    const init = async () => {
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.data.user);
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    init();
  }, [token, logout]);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    const { token: newToken, user: newUser } = data.data;
    localStorage.setItem('laundry_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
