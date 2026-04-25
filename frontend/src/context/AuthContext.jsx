import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }, []);

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return false;
    try {
      const response = await fetch(`${API_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/user/me/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status === 401) {
          const refreshed = await refreshToken();
          if (refreshed) {
            // Повторяем запрос с новым токеном
            const retryResponse = await fetch(`${API_URL}/api/user/me/`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            if (retryResponse.ok) {
              setUser(await retryResponse.json());
            } else {
              logout();
            }
          } else {
            logout();
          }
        }
      } catch {
        logout();
      }
      setLoading(false);
    };
    checkAuth();
  }, [logout, refreshToken]);

  const login = async (email, password) => {
    // Базовая валидация на фронте
    if (!email || !password) {
      return { success: false, message: 'Заполните все поля' };
    }
    try {
      const response = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        setUser(data.user);
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.detail || 'Неверный email или пароль' };
      }
    } catch {
      return { success: false, message: 'Сервер недоступен' };
    }
  };

  const register = async ({ username, email, password, role, teacher_code }) => {
    // Валидация на фронте перед отправкой
    if (!email || !password || !username) {
      return { success: false, message: 'Заполните все поля' };
    }
    if (password.length < 8) {
      return { success: false, message: 'Пароль должен быть не менее 8 символов' };
    }
    try {
      const response = await fetch(`${API_URL}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          teacher_code: teacher_code?.trim().toUpperCase() || ''
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, teacher_code: data.teacher_code || null };
      } else {
        const err = await response.json();
        const messages = Object.values(err).flat().join(' ');
        return { success: false, message: messages };
      }
    } catch {
      return { success: false, message: 'Сервер недоступен' };
    }
  };

  const updateProfile = async (profileData) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { success: false, message: 'Не авторизован — войдите заново' };
    }
    try {
      const response = await fetch(`${API_URL}/api/user/setup/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, message: Object.values(errorData).flat().join(' ') };
      }
    } catch {
      return { success: false, message: 'Сервер недоступен' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateProfile,
      isAuthenticated: !!user,
      loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);