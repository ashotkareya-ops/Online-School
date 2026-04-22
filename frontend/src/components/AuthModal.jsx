import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const passwordsMatch = isLogin || (password !== '' && password === confirmPassword);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSwitch = () => {
    setIsLogin(prev => !prev);
    resetForm();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && !passwordsMatch) {
      setError('Пароли не совпадают');
      return;
    }

    const result = login(email, password);
    if (result.success) {
      resetForm();
      onClose();
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <button className="modal-close" type="button" onClick={onClose}>×</button>

        <h2 className="modal-title">{isLogin ? 'Вход' : 'Регистрация'}</h2>

        <form className="modal-form" onSubmit={handleSubmit} autoComplete="off">
          {!isLogin && (
            <input
              type="text"
              placeholder="Имя пользователя"
              className="modal-input"
              autoComplete="new-password"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="modal-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="new-password"
            required
          />

          <input
            type="password"
            placeholder="Пароль"
            className="modal-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          {!isLogin && (
            <>
              <input
                type="password"
                placeholder="Повторите пароль"
                className={`modal-input ${!passwordsMatch && confirmPassword ? 'modal-input--error' : ''}`}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />

              <div className="role-picker">
                {['student', 'teacher'].map(r => (
                  <label
                    key={r}
                    className={`role-option ${role === r ? 'role-option--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      hidden
                    />
                    {r === 'student' ? 'Ученик' : 'Учитель'}
                  </label>
                ))}
              </div>
            </>
          )}

          {error && <span className="modal-error">{error}</span>}

          <button
            type="submit"
            className="modal-submit"
            disabled={!passwordsMatch}
          >
            {isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="modal-footer">
          {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <span className="modal-link" onClick={handleSwitch}>
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;