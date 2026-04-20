import React from 'react';
import './Navbar.css';

// Добавь фигурные скобки вокруг onAuthClick
const Navbar = ({ onAuthClick }) => { 
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1>Math</h1>
      </div>
      <div className="navbar-actions">
        {/* Теперь onAuthClick — это функция, а не объект */}
        <button className="auth-button" type="button" onClick={onAuthClick}>
          Войти
        </button>
      </div>
    </nav>
  );
};

export default Navbar;