/* src/components/Auth/AuthForm.jsx
import { useState } from 'react';
import './AuthForm.css';

export const AuthForm = ({ type, onSubmit }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Некорректный email';
    if (formData.password.length < 6) newErrors.password = 'Пароль от 6 символов';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length === 0) {
      onSubmit(formData);
    } else {
      setErrors(validationErrors);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">{type === 'login' ? 'Вход' : 'Регистрация'}</h2>
      <input
        type="email"
        placeholder="Email"
        className={errors.email ? 'error' : ''}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      {errors.email && <span className="error-text">{errors.email}</span>}
      
      <input
        type="password"
        placeholder="Пароль"
        className={errors.password ? 'error' : ''}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
      />
      {errors.password && <span className="error-text">{errors.password}</span>}

      <button type="submit" className="btn-mint-gradient">
        {type === 'login' ? 'Войти' : 'Создать аккаунт'}
      </button>
    </form>
  );
}; */


// src/components/Auth/AuthForm.jsx
import { useState } from 'react';
import './AuthForm.css';

export const AuthForm = ({ type, onSubmit }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Некорректный email';
    if (formData.password.length < 6) newErrors.password = 'Пароль от 6 символов';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length === 0) {
      onSubmit(formData);
    } else {
      setErrors(validationErrors);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">{type === 'login' ? 'Вход' : 'Регистрация'}</h2>
      <input
        type="email"
        placeholder="Email"
        className={errors.email ? 'error' : ''}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      {errors.email && <span className="error-text">{errors.email}</span>}
      
      <input
        type="password"
        placeholder="Пароль"
        className={errors.password ? 'error' : ''}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
      />
      {errors.password && <span className="error-text">{errors.password}</span>}

      <button type="submit" className="btn-mint-gradient">
        {type === 'login' ? 'Войти' : 'Создать аккаунт'}
      </button>
    </form>
  );
};