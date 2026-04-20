import React, { useState } from 'react';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;
  const isPasswordMatch = isLogin || (password === confirmPassword && password !== '');
  const handleOverlayClick = (e) => {
    
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordMatch) {
      alert("Пароли не совпадают!");
      return;
    }
    console.log("Форма отправлена", { password });
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>×</button>
        
        <h2 style={styles.title}>{isLogin ? 'Вход' : 'Регистрация'}</h2>
        
        <form style={styles.form} onSubmit={handleSubmit}>
          {!isLogin && (
            <input type="text" placeholder="Имя пользователя" style={styles.input} required />
          )}
          
          <input type="email" placeholder="Email" style={styles.input} required />
          
          <input 
            type="password" 
            placeholder="Пароль" 
            style={styles.input} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />

        
          {!isLogin && (
            <input 
              type="password" 
              placeholder="Повторите пароль" 
              style={{
                ...styles.input,
                
                border: !isPasswordMatch && confirmPassword !== '' 
                        ? '1px solid #ff4d4d' 
                        : '1px solid rgba(255, 255, 255, 0.5)'
              }} 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          )}
          
          {!isLogin && !isPasswordMatch && confirmPassword !== '' && (
            <span style={{ color: '#ff4d4d', fontSize: '12px' }}>Пароли должны совпадать</span>
          )}
          
          <button 
            style={{
              ...styles.submitBtn,
              
              opacity: isPasswordMatch ? 1 : 0.5,
              cursor: isPasswordMatch ? 'pointer' : 'not-allowed'
            }}
            disabled={!isPasswordMatch}
          >
            {isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <p style={styles.footerText}>
          {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{' '}
          <span style={styles.link} onClick={() => {
            setIsLogin(!isLogin);
            setPassword('');
            setConfirmPassword('');
          }}>
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </span>
        </p>
      </div>
    </div>
  );
};


const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 2000,
    backdropFilter: 'blur(5px)',
  },
  modal: {
    background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)', borderRadius: '30px',
    padding: '40px', width: '90%', maxWidth: '400px', position: 'relative',
    textAlign: 'center', color: '#333',
  },
  closeBtn: {
    position: 'absolute', top: '15px', right: '20px', background: 'none',
    border: 'none', color: '#cc890cd2', fontSize: '28px', cursor: 'pointer',
  },
  title: { marginBottom: '25px', fontSize: '24px', color: '#cc890cd2' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: {
    padding: '12px 15px', borderRadius: '15px', border: '1px solid rgba(255, 255, 255, 0.5)',
    background: 'rgba(255, 255, 255, 0.4)', outline: 'none', fontSize: '16px', color: '#333',
  },
  submitBtn: {
    background: '#cc890cd2', color: 'white', border: 'none',
    padding: '12px 24px', borderRadius: '20px', fontWeight: '600',
    fontSize: '16px', transition: 'transform 0.2s ease', marginTop: '10px',
  },
  footerText: { marginTop: '20px', fontSize: '14px', color: '#444' },
  link: { color: '#cc890cd2', cursor: 'pointer', fontWeight: '700', textDecoration: 'underline' }
};

export default AuthModal;