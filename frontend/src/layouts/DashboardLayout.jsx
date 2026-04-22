import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Пример данных — позже мы будем получать их с бэкенда
  const tasks = [
    { id: 1, title: 'Квадратные уравнения', status: 'Новое', deadline: '25.04' },
    { id: 2, title: 'Тригонометрия: синусы', status: 'В процессе', deadline: '27.04' },
  ];

  // Если вдруг данных о пользователе нет, показываем загрузку или пустой экран
  if (!user) return <div className="loading">Загрузка...</div>;

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-logo">Math.School</div>
        <nav className="sidebar-nav">
          <ul>
            <li className="active">
              {user.role === 'teacher' ? 'Мои курсы' : 'Мои задания'}
            </li>
            <li>{user.role === 'teacher' ? 'Ученики' : 'Курсы'}</li>
            <li>Профиль</li>
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
          <p className="user-email">{user.email}</p>
        </header>

        <section className="dashboard-content">
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-value">12</span>
              <span className="stat-label">Выполнено</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">2</span>
              <span className="stat-label">В очереди</span>
            </div>
          </div>

          <div className="content-header">
            <h2>{user.role === 'teacher' ? 'Управление заданиями' : 'Актуальные задания'}</h2>
            {user.role === 'teacher' && (
               <button className="add-task-btn">+ Создать задание</button>
            )}
          </div>

          <div className="tasks-grid">
            {tasks.map(task => (
              <div key={task.id} className="task-card">
                <h3>{task.title}</h3>
                <div className="task-info">
                  <span className={`status ${task.status === 'Новое' ? 'new' : ''}`}>
                    {task.status}
                  </span>
                  <span className="deadline">До {task.deadline}</span>
                </div>
                <button className="btn-start">
                  {user.role === 'teacher' ? 'Редактировать' : 'Начать'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;