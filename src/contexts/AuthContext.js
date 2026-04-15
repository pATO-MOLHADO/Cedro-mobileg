import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaura sessão ao abrir o app
  useEffect(() => {
    (async () => {
      try {
        const results = await AsyncStorage.multiGet(['token', 'usuario']);
        const storedToken = results[0][1];
        const storedUser  = results[1][1];
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn('Erro ao restaurar sessão:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (userData, authToken) => {
    try {
      await AsyncStorage.multiSet([
        ['token', authToken],
        ['usuario', JSON.stringify(userData)],
      ]);
      setToken(authToken);
      setUser(userData);
    } catch (e) {
      console.warn('Erro ao salvar sessão:', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'usuario']);
    } catch (_) {}
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    try {
      await AsyncStorage.setItem('usuario', JSON.stringify(merged));
    } catch (_) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
