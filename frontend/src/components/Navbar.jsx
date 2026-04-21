import React from 'react';
import './Navbar.css';

const Navbar = ({ onAuthClick }) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        {/* Ссылка правильно обёртывает только логотип */}
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1>Math</h1>
        </a>
      </div>
      <div className="navbar-actions">
        {/* type="button" явно указан — предотвращает случайный submit формы */}
        <button className="auth-button" type="button" onClick={onAuthClick}>
          Войти
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

/*
  ЧТО БЫЛО ИСПРАВЛЕНО:
  - Удалён мёртвый JSX-код в самом конце файла (две строки <a> и <h1>),
    который находился вне компонента. Это вызывало ошибку парсинга.
  - Оставлен явный type="button" на кнопке — важно, чтобы браузер
    не воспринимал её как submit внутри потенциальной формы-родителя.
*/
