import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setTeacherCode('');
    setError('');
    setRole('student');
  };

  const handleSwitch = () => {
    setIsLogin(prev => !prev);
    resetForm();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setTeacherCode('');
    setError('');
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
        const selectedRole = role === 'teacher' ? 'teacher' : 'student';
        const selectedTeacherCode = selectedRole === 'student' ? teacherCode.trim().toUpperCase() : '';

        const result = await register({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: selectedRole,
          teacher_code: selectedTeacherCode,
        });

        if (result.success) {
          const loginResult = await login(email.trim().toLowerCase(), password);
          if (loginResult.success) {
            resetForm();
            onClose();
            navigate('/dashboard');
          } else {
            setError('Аккаунт создан! Попробуйте войти вручную.');
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

  const isSubmitDisabled =
    isLoading ||
    !passwordsMatch ||
    (!isLogin && !username.trim());

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

              {/* Выбор роли */}
              <div className="role-picker">
                <label className={`role-option ${role === 'student' ? 'role-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={role === 'student'}
                    onChange={() => handleRoleChange('student')}
                    hidden
                  />
                  Ученик
                </label>
                <label className={`role-option ${role === 'teacher' ? 'role-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={role === 'teacher'}
                    onChange={() => handleRoleChange('teacher')}
                    hidden
                  />
                  Учитель
                </label>
              </div>

              {/* Код учителя — ТОЛЬКО для ученика */}
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

              {/* Подсказка для учителя */}
              {role === 'teacher' && (
                <p style={{
                  fontSize: '13px',
                  color: '#777',
                  margin: '4px 0 8px',
                  lineHeight: '1.6',
                  background: 'rgba(0,208,132,0.07)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}>
                  После регистрации вы сразу попадёте в личный кабинет. Доступ к разделам откроется после подтверждения администратором.
                </p>
              )}
            </>
          )}

          {error && <span className="modal-error">{error}</span>}

          <button
            type="submit"
            className="modal-submit"
            disabled={isSubmitDisabled}
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