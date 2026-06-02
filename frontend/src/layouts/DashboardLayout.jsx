import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SetupProfileModal from '../components/SetupProfileModal/SetupProfileModal';
import TaskBank from '../components/TaskBank/TaskBank';
import './DashboardLayout.css';
import Schedule from '../components/Schedule/Schedule';

const EXAM_LABELS = { oge: 'ОГЭ', ege: 'ЕГЭ' };

const PendingBanner = () => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.12), rgba(255, 152, 0, 0.08))',
    border: '1px solid rgba(255, 193, 7, 0.4)',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  }}>
    <span style={{ fontSize: '28px', flexShrink: 0 }}>⏳</span>
    <div>
      <p style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '16px', color: '#92600a' }}>
        Аккаунт на проверке
      </p>
      <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#7a5212', lineHeight: '1.6' }}>
        Администратор проверит вашу заявку и подтвердит аккаунт. Обычно это занимает до 24 часов.
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.6)',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '13px',
        color: '#555',
        lineHeight: '1.7',
      }}>
        <strong>После подтверждения вы сможете:</strong><br />
        — Заполнить профиль: имя, предметы, тип экзамена<br />
        — Получить персональный код для учеников<br />
        — Создавать и проверять домашние задания
      </div>
    </div>
  </div>
);

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [activeSubject, setActiveSubject] = useState('Все');
  const [showSetup, setShowSetup] = useState(false);

  const isPendingTeacher = user?.role === 'teacher' && !user?.is_approved;

  useEffect(() => {
    if (!user) return;
    if (isPendingTeacher) {
      setActiveTab('home');
      return;
    }
    if (user.role === 'student' && !user.is_profile_filled) {
      setShowSetup(true);
    } else if (user.role === 'teacher' && user.is_approved && !user.is_profile_filled) {
      setShowSetup(true);
    } else {
      setShowSetup(false);
    }
  }, [user, isPendingTeacher]);

  const [errorTasks, setErrorTasks] = useState([
    { id: 101, code: 'ЕГЭ №1', title: 'Вычисления по формулам', subject: 'Математика' },
    { id: 105, code: 'ОГЭ №9', title: 'Линейные уравнения', subject: 'Математика' },
    { id: 108, code: 'ДЗ №3', title: 'Циклы While/For', subject: 'Программирование' },
  ]);

  const [homeworks] = useState([
    { id: 1, title: 'Реакция на события в JS', subject: 'Программирование', status: 'todo' },
    { id: 2, title: 'Квадратные уравнения', subject: 'Математика', status: 'review' },
    { id: 3, title: 'Работа с API', subject: 'Программирование', status: 'review' },
    { id: 4, title: 'Тригонометрия: синусы', subject: 'Математика', status: 'todo' },
  ]);

  // Демонстрационные данные для наполнения раздела Тренажер
  const [trainingTopics] = useState([
    { id: 1, title: 'Тренажер: Квадратные уравнения', subject: 'Математика', count: '25 заданий' },
    { id: 2, title: 'Тренажер: Арифметическая прогрессия', subject: 'Математика', count: '15 заданий' },
    { id: 3, title: 'Тренажер: Синтаксис и циклы JavaScript', subject: 'Программирование', count: '30 заданий' },
    { id: 4, title: 'Тренажер: Методы массивов (map, filter)', subject: 'Программирование', count: '20 заданий' },
  ]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    setShowSetup(false);
  };

  const handleSolveError = (id) => {
    setErrorTasks(prev => prev.filter(task => task.id !== id));
    alert('Задание решено верно!');
  };

  const handleTabClick = (tab) => {
    if (isPendingTeacher && tab !== 'home' && tab !== 'profile') return;
    // Сбрасываем фильтр по предметам на "Все" при переключении вкладок для корректного отображения
    setActiveSubject('Все');
    setActiveTab(tab);
  };

  if (!user) return <div className="loading">Загрузка...</div>;

  const navItems = [
    { key: 'home', label: 'Главная' },
    { key: 'training', label:  'Тренажер' },
    { key: 'homework-list', label: 'Домашняя работа' },
    { key: 'homework-status', label: user.role === 'teacher' ? 'Банк заданий' : 'Мои ошибки' },
    { key: 'schedule', label: 'Расписание' },
    { key: 'profile', label: 'Профиль' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="main-container">
            {isPendingTeacher && <PendingBanner />}
            <h2>Добро пожаловать, {user.username || user.email}!</h2>
            <p>
              {isPendingTeacher
                ? 'Пока аккаунт не подтверждён, доступ к разделам ограничен.'
                : 'Выберите раздел в меню слева, чтобы приступить к работе.'}
            </p>
          </div>
        );

      case 'training': {
        const subjects = ['Все', 'Математика', 'Программирование'];
        const filteredTopics = activeSubject === 'Все'
          ? trainingTopics
          : trainingTopics.filter(topic => topic.subject === activeSubject);

        return (
          <div className="main-container">
            <div className="content-header">
              <h2>Интерактивный тренажер</h2>
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

            <div className="tasks-grid">
              {filteredTopics.length > 0 ? (
                filteredTopics.map(topic => (
                  <div key={topic.id} className="task-card">
                    <div className="task-info">
                      <span className="subject-tag">{topic.subject}</span>
                      <span className="deadline">{topic.count}</span>
                    </div>
                    <h3>{topic.title}</h3>
                    <button 
                      className="btn-start" 
                      onClick={() => alert(`Запуск тренажера: ${topic.title}`)}
                    >
                      Начать тренировку
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-errors">Темы для выбранного предмета отсутствуют</div>
              )}
            </div>
          </div>
        );
      }

      case 'homework-list': {
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
      }

      case 'schedule':
        return <Schedule />;

      case 'homework-status':
        if (user.role === 'teacher') {
          return <TaskBank user={user} />;
        }
        return (
          <div className="main-container">
            <div className="error-header">
              <h2>Мои ошибки</h2>
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
                <div className="empty-errors">🎉 Ошибок нет!</div>
              )}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="profile-section">
            <h2>Мой профиль</h2>
            <div className="profile-info-card">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Имя:</strong> {user.first_name || '—'}</p>
              <p><strong>Фамилия:</strong> {user.last_name || '—'}</p>
              <p><strong>Роль:</strong> {user.role === 'teacher' ? 'Учитель' : 'Ученик'}</p>

              {user.role === 'teacher' && user.is_approved && (
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  background: 'rgba(0,208,132,0.1)',
                  borderRadius: '12px',
                  border: '2px solid #00d084',
                }}>
                  <p style={{ marginBottom: '5px' }}><strong>Ваш код для учеников:</strong></p>
                  <span style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '3px', color: '#00d084' }}>
                    {user.teacher_code}
                  </span>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Учеников подключено: {user.students_count || 0}
                  </p>
                </div>
              )}

              {user.role === 'teacher' && !user.is_approved && (
                <div style={{
                  marginTop: '15px',
                  padding: '14px 16px',
                  background: 'rgba(255,193,7,0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,193,7,0.4)',
                  fontSize: '14px',
                  color: '#92600a',
                }}>
                  ⏳ Аккаунт ожидает подтверждения администратором
                </div>
              )}

              {user.role === 'student' && (
                <div style={{ marginTop: '15px' }}>
                  <p><strong>Экзамен:</strong> {user.exam_type?.length > 0 ? user.exam_type.map(t => EXAM_LABELS[t] || t).join(', ') : '—'}</p>
                  <p><strong>Предметы:</strong> {user.subjects?.length > 0 ? user.subjects.join(', ') : '—'}</p>
                  <p><strong>Статус профиля:</strong> {user.is_profile_filled ? '✅ Заполнен' : '⚠️ Требует настройки'}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <h2>Раздел в разработке</h2>;
    }
  };

  return (
    <div className="dashboard-wrapper">
      {showSetup && (
        <SetupProfileModal onSave={handleSaveProfile} />
      )}

      <aside className="sidebar">
        <div className="sidebar-logo">Твой репетитор</div>
        <nav className="sidebar-nav">
          <ul>
            {navItems.map(({ key, label }) => {
              const isLocked = isPendingTeacher && key !== 'home' && key !== 'profile';
              return (
                <li
                  key={key}
                  className={activeTab === key ? 'active' : ''}
                  onClick={() => handleTabClick(key)}
                  style={isLocked ? {
                    opacity: 0.4,
                    cursor: 'not-allowed',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  } : {}}
                  title={isLocked ? 'Доступно после подтверждения аккаунта' : ''}
                >
                  {label}
                  {isLocked && <span style={{ fontSize: '13px', marginLeft: '6px' }}>🔒</span>}
                </li>
              );
            })}
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
            {isPendingTeacher && (
              <span style={{
                background: 'rgba(255,193,7,0.2)',
                color: '#92600a',
                fontSize: '12px',
                fontWeight: '600',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255,193,7,0.4)',
              }}>
                ⏳ На проверке
              </span>
            )}
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