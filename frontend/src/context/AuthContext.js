import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const response = await getCurrentUser();
        if (!isMounted) return;
        setUser(response.data?.user || null);
      } catch (err) {
        if (!isMounted) return;
        setUser(null);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
