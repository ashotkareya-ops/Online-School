import React, {useState} from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tasks');
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

 const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <>
            <div className="content-header">
              <h2>{user.role === 'teacher' ? 'Управление заданиями' : 'Актуальные задания'}</h2>
              {user.role === 'teacher' && <button className="add-task-btn">+ Создать задание</button>}
            </div>
            <div className="tasks-grid">
              {/* Ваш существующий маппинг задач */}
              {[{ id: 1, title: 'Квадратные уравнения', status: 'Новое', deadline: '25.04' }].map(task => (
                <div key={task.id} className="task-card">
                  <h3>{task.title}</h3>
                  <button className="btn-start">Начать</button>
                </div>
              ))}
            </div>
          </>
        );
      case 'tools':
        return <h2>{user.role === 'teacher' ? 'Список учеников' : 'Интерактивные тренажеры'}</h2>;
      case 'profile':
        return (
          <div className="profile-section">
            <h2>Мой профиль</h2>
            <p>Email: {user.email}</p>
            <p>Роль: {user.role === 'teacher' ? 'Учитель' : 'Ученик'}</p>
          </div>
        );
      default:
        return <h2>Раздел в разработке</h2>;
    }
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-logo">Твой репетитор</div>
        <nav className="sidebar-nav">
          <ul>
          {/* 1. Главная */}
            <li 
              className={activeTab === 'home' ? 'active' : ''} 
              onClick={() => setActiveTab('home')}
            >
              Главная
            </li>

            {/* 2. Выданные ДЗ / Мое обучение */}
            <li 
              className={activeTab === 'homework-list' ? 'active' : ''} 
              onClick={() => setActiveTab('homework-list')}
            >
              {user.role === 'teacher' ? 'Выданные ДЗ' : 'Мое обучение'}
            </li>

            {/* 3. Проверка ДЗ / Мои ошибки */}
            <li 
              className={activeTab === 'homework-status' ? 'active' : ''} 
              onClick={() => setActiveTab('homework-status')}
            >
              {user.role === 'teacher' ? 'Проверка ДЗ' : 'Мои ошибки'}
            </li>

            {/* 4. Банк заданий (только для учителя) */}
            {user.role === 'teacher' && (
              <li 
                className={activeTab === 'task-bank' ? 'active' : ''} 
                onClick={() => setActiveTab('task-bank')}
              >
                Банк заданий
              </li>
            )}

            {/* 5. Ученики (только для учителя) */}
            {user.role === 'teacher' && (
              <li 
                className={activeTab === 'students' ? 'active' : ''} 
                onClick={() => setActiveTab('students')}
              >
                Ученики
              </li>
            )}

            {/* 6. Профиль */}
            <li 
              className={activeTab === 'profile' ? 'active' : ''} 
              onClick={() => setActiveTab('profile')}
            >
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
          {/* Динамически вызываем функцию отрисовки */}
          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;