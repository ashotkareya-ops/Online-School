import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const MOCK_USERS = [
  { email: 's@math.ru', password: '123', role: 'student', username: 'Иван Ученик' },
  { email: 't@math.ru', password: '456', role: 'teacher', username: 'Александр Петрович' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('math_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (email, password) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      localStorage.setItem('math_user', JSON.stringify(found));
      return { success: true };
    }
    return { success: false, message: 'Неверный логин или пароль' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('math_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);