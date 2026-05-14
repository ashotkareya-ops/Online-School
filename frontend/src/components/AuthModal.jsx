import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const passwordsMatch = isLogin || (password !== '' && password === confirmPassword);

  const resetForm = () => {
    setUsername(''); setEmail(''); setPassword('');
    setConfirmPassword(''); setTeacherCode(''); setError('');
  };

  const handleSwitch = () => {
    setIsLogin(prev => !prev);
    resetForm();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isLogin) {
      if (!passwordsMatch) {
        setError('Пароли не совпадают');
        setIsLoading(false);
        return;
      }
      if (role === 'student' && !teacherCode.trim()) {
        setError('Введите код учителя');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          resetForm();
          onClose();
          navigate('/dashboard');
        } else {
          setError(result.message || 'Произошла ошибка');
        }
      } else {
        const result = await register({ username, email, password, role, teacher_code: teacherCode });
        if (result.success) {
          // И учитель, и ученик — сразу логинимся и переходим в дашборд
          // Учитель увидит экран ожидания уже внутри дашборда
          const loginResult = await login(email, password);
          if (loginResult.success) {
            resetForm();
            onClose();
            navigate('/dashboard');
          } else {
            setError('Аккаунт создан, но войти не удалось. Попробуйте войти вручную.');
          }
        } else {
          setError(result.message || 'Произошла ошибка');
        }
      }
    } catch {
      setError('Нет связи с сервером');
    } finally {
      setIsLoading(false);
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
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={30}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="modal-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Пароль (минимум 8 символов)"
            className="modal-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={8}
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
                required
              />

              <div className="role-picker">
                {['student', 'teacher'].map(r => (
                  <label key={r} className={`role-option ${role === r ? 'role-option--active' : ''}`}>
                    <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} hidden />
                    {r === 'student' ? 'Ученик' : 'Учитель'}
                  </label>
                ))}
              </div>

              {role === 'student' && (
                <input
                  type="text"
                  placeholder="Код вашего учителя"
                  className="modal-input"
                  value={teacherCode}
                  onChange={e => setTeacherCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                />
              )}

              {role === 'teacher' && (
                <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 8px', lineHeight: '1.5' }}>
                  После регистрации аккаунт будет проверен администратором. Вы сразу попадёте в личный кабинет.
                </p>
              )}
            </>
          )}

          {error && <span className="modal-error">{error}</span>}

          <button
            type="submit"
            className="modal-submit"
            disabled={isLoading || !passwordsMatch || (!isLogin && !username)}
          >
            {isLoading ? 'Загрузка...' : isLogin ? 'Войти' : 'Создать аккаунт'}
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