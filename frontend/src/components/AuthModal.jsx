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
  const [teacherCode, setTeacherCode] = useState('');

  if (!isOpen) return null;
  const passwordsMatch = isLogin || (password !== '' && password === confirmPassword);

  const resetForm = () => {
  setEmail('');
  setPassword('');
  setConfirmPassword('');
  setTeacherCode(''); 
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

  // 1. Валидация для регистрации
  if (!isLogin) {
    if (!passwordsMatch) {
      setError('Пароли не совпадают');
      return;
    }
    // Проверка кода учителя только для ученика
    if (role === 'student' && !teacherCode.trim()) {
      setError('Пожалуйста, введите код учителя');
      return;
    }
  }

  // 2. Вызов функции login (передаем все 4 параметра)
  // Если это вход (isLogin), роль и код уйдут как null
  const result = login(
    email, 
    password, 
    isLogin ? null : role, 
    isLogin ? null : teacherCode
  );

  // 3. Обработка результата
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
        {/* 1. Имя пользователя (только при регистрации) */}
        {!isLogin && (
          <input
            type="text"
            placeholder="Имя пользователя"
            className="modal-input"
            autoComplete="off"
            required
          />
        )}

        {/* 2. Поля Email и Пароль (всегда) */}
        <input
          type="text"
          inputMode="email"
          placeholder="Email"
          className="modal-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="off"
          required
        />

        <input
          type="text"
          placeholder="Пароль"
          className="modal-input modal-input--password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="off"
          required
        />

        {/* 3. Дополнительные поля только для регистрации */}
        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Повторите пароль"
              className={`modal-input modal-input--password ${!passwordsMatch && confirmPassword ? 'modal-input--error' : ''}`}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="off"
              required
            />

            {/* Выбор роли */}
            <div className="role-picker">
              {['student', 'teacher'].map(r => (
                <label key={r} className={`role-option ${role === r ? 'role-option--active' : ''}`}>
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

            {/* ЛОГИКА: Поле для кода учителя — только если выбран Ученик */}
            {role === 'student' && (
              <input
                type="text"
                placeholder="Код вашего учителя"
                className="modal-input"
                value={teacherCode}
                onChange={e => setTeacherCode(e.target.value)}
                required={role === 'student'}
              />
            )}
          </>
        )}

        {/* 4. Ошибки и Кнопка отправки */}
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