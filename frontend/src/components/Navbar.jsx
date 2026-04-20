import React from 'react';
import './Navbar.css';

const Navbar = ({onAuthClick}) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1>Math</h1>
        </a>
      </div>
      <div className="navbar-actions">
        <button className="auth-button" type="button" onClick={onAuthClick}>
          Войти
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

<a href="/" style={{ textDecoration: 'none' }}>
  <h1 className='navbar-logo'>Math</h1>
</a>