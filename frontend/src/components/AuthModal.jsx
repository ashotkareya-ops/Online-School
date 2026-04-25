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
  const [showTeacherCode, setShowTeacherCode] = useState(null);

  if (!isOpen) return null;

  const passwordsMatch = isLogin || (password !== '' && password === confirmPassword);

  const resetForm = () => {
    setUsername('');
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
    if (e.target === e.currentTarget && !showTeacherCode) onClose();
  };

  const handleTeacherCodeClose = () => {
    setShowTeacherCode(null);
    navigate('/dashboard');
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
      if (password.length < 8) {
        setError('Пароль должен быть не менее 8 символов');
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
          const loginResult = await login(email, password);
          if (loginResult.success) {
            resetForm();
            onClose();
            if (role === 'teacher' && result.teacher_code) {
              setShowTeacherCode(result.teacher_code);
            } else {
              navigate('/dashboard');
            }
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

  // Модалка с кодом учителя
  if (showTeacherCode) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ textAlign: 'center' }}>
          <h2 className="modal-title">🎉 Вы зарегистрированы!</h2>
          <p style={{ color: '#444', marginBottom: '10px' }}>
            Ваш персональный код для учеников:
          </p>
          <div style={{
            background: 'rgba(0,208,132,0.15)',
            border: '2px solid #00d084',
            borderRadius: '15px',
            padding: '20px',
            margin: '15px 0',
            fontSize: '28px',
            fontWeight: '800',
            letterSpacing: '4px',
            color: '#00d084'
          }}>
            {showTeacherCode}
          </div>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
            Сохраните этот код! Ученики будут вводить его при регистрации.<br />
            Вы также найдёте его в своём профиле.
          </p>
          <button className="modal-submit" onClick={handleTeacherCodeClose}>
            Перейти в кабинет
          </button>
        </div>
      </div>
    );
  }

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