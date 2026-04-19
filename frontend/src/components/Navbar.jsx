import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1>Math</h1>
      </div>
      <div className="navbar-actions">
        <button className="auth-button" type="button">
          Войти
        </button>
      </div>
    </nav>
  );
};

export default Navbar;