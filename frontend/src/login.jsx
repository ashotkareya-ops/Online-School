import React, { useState } from 'react';
import { loginUser } from './api';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await loginUser(email, password);
            alert('Вы вошли в систему!');
            // Здесь можно перенаправить пользователя на страницу школы
        } catch (err) {
            alert('Неверный логин или пароль');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
            <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
                type="password" 
                placeholder="Пароль" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
            />
            <button type="submit">Войти</button>
        </form>
    );
}

export default Login;