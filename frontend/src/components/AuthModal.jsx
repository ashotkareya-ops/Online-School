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
        setError('Пожалуйста, введите код учителя');
        setIsLoading(false);
        return;
      }
    }

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await register({
          username,
          email,
          password,
          role,
          teacher_code: teacherCode
        });
      }

      if (result.success) {
        resetForm();
        onClose();
        if (isLogin) {
          navigate('/dashboard');
        } else {
          alert('Регистрация успешна! Теперь вы можете войти.');
          setIsLogin(true);
        }
      } else {
        setError(result.message || 'Произошла ошибка');
      }
    } catch (err) {
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
            placeholder="Пароль"
            className="modal-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
                  onChange={e => setTeacherCode(e.target.value)}
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