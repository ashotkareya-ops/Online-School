import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home'); 
  const [activeSubject, setActiveSubject] = useState('Все');

  // --- ДАННЫЕ ДЛЯ РАЗДЕЛА "МОИ ОШИБКИ" ---
  // В будущем эти данные будут приходить с бэкенда, когда в любом тесте был дан неверный ответ
  const [errorTasks, setErrorTasks] = useState([
    { id: 101, code: 'ЕГЭ №1', title: 'Вычисления по формулам', subject: 'Математика' },
    { id: 105, code: 'ОГЭ №9', title: 'Линейные уравнения', subject: 'Математика' },
    { id: 108, code: 'ДЗ №3', title: 'Циклы While/For', subject: 'Программирование' },
  ]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Пример данных для ДЗ
  const [homeworks] = useState([
    { id: 1, title: 'Реакция на события в JS', subject: 'Программирование', status: 'todo' },
    { id: 2, title: 'Квадратные уравнения', subject: 'Математика', status: 'review' },
    { id: 3, title: 'Работа с API', subject: 'Программирование', status: 'review' },
    { id: 4, title: 'Тригонометрия: синусы', subject: 'Математика', status: 'todo' },
  ]);

  // Функция для "отработки" ошибки
  const handleSolveError = (id) => {
    // Здесь будет логика открытия модалки с заданием или перехода к решению.
    // Если решение верное -> удаляем из списка:
    setErrorTasks(prev => prev.filter(task => task.id !== id));
    alert("Задание решено верно! Оно удалено из списка ошибок.");
  };

  if (!user) return <div className="loading">Загрузка...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="main-container">
            <h2>Добро пожаловать, {user.email}!</h2>
            <p>Выберите раздел в меню слева, чтобы приступить к работе.</p>
          </div>
        );

      case 'homework-list':
        const subjects = ['Все', 'Математика', 'Программирование'];
        const filteredBySubject = activeSubject === 'Все' 
          ? homeworks 
          : homeworks.filter(h => h.subject === activeSubject);

        const todoTasks = filteredBySubject.filter(h => h.status === 'todo');
        const reviewTasks = filteredBySubject.filter(h => h.status === 'review');

        return (
          <div className="main-container">
            <div className="stats-container">
              <div className="stat-card todo-border">
                <span className="stat-label">Нужно сделать</span>
                <span className="stat-value">{todoTasks.length}</span>
              </div>
              <div className="stat-card review-border">
                <span className="stat-label">На проверке</span>
                <span className="stat-value">{reviewTasks.length}</span>
              </div>
            </div>

            <div className="tabs-header">
              {subjects.map(subject => (
                <button 
                  key={subject}
                  className={`tab-button ${activeSubject === subject ? 'active' : ''}`}
                  onClick={() => setActiveSubject(subject)}
                >
                  {subject}
                </button>
              ))}
            </div>

            <div className="homework-grid">
              <div className="homework-column">
                <h3 className="column-title">Не сделанные</h3>
                {todoTasks.map(hw => (
                  <div key={hw.id} className="hw-item-card">{hw.title}</div>
                ))}
              </div>
              <div className="homework-column">
                <h3 className="column-title">Отправленные</h3>
                {reviewTasks.map(hw => (
                  <div key={hw.id} className="hw-item-card">{hw.title}</div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'homework-status': // РАЗДЕЛ "МОИ ОШИБКИ"
        return (
          <div className="main-container">
            <div className="error-header">
            </div>
            
            <div className="error-list">
              {errorTasks.length > 0 ? (
                errorTasks.map(task => (
                  <div key={task.id} className="error-card">
                    <div className="error-badge">{task.code}</div>
                    <div className="error-info">
                      <h4>{task.title}</h4>
                      <span className="subject-tag">{task.subject}</span>
                    </div>
                    <button className="btn-solve" onClick={() => handleSolveError(task.id)}>
                      Решить снова
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-errors">🎉 Ошибок нет! Ты всё усвоил.</div>
              )}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="profile-section">
            <h2>Мой профиль</h2>
            <p>Email: {user.email}</p>
            <p>Роль: {user.role === 'teacher' ? 'Учитель' : 'Ученик'}</p>
          </div>
        );

      default:
        return <h2>Раздел "{activeTab}" в разработке</h2>;
    }
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-logo">Твой репетитор</div>
        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
              Главная
            </li>
            <li className={activeTab === 'homework-list' ? 'active' : ''} onClick={() => setActiveTab('homework-list')}>
              Домашняя работа
            </li>
            <li className={activeTab === 'homework-status' ? 'active' : ''} onClick={() => setActiveTab('homework-status')}>
              {user.role === 'teacher' ? 'Банк заданий' : 'Мои ошибки'}
            </li>
            {user.role === 'teacher' && (
              <li className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>
                Ученики
              </li>
            )}
            <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
              Профиль
            </li>
          </ul>
        </nav>
        <button onClick={handleLogout} className="logout-btn">Выйти</button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-info">
            <h1>Личный кабинет</h1>
            <span className="role-badge">
              {user.role === 'teacher' ? 'Преподаватель' : 'Студент'}
            </span>
          </div>
        </header>

        <section className="dashboard-content">
          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;