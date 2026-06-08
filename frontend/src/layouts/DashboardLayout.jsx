import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SetupProfileModal from '../components/SetupProfileModal/SetupProfileModal';
import TaskBank from '../components/TaskBank/TaskBank';
import Trainer from '../components/Trainer/Trainer';
import Homework from '../Homework/Homework';
import './DashboardLayout.css';
import Schedule from '../components/Schedule/Schedule';
import TeacherHomework from '../Homework/TeacherHomework';

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
    { id: 1, title: 'Реакция на события в JS',  subject: 'Программирование', status: 'todo',    deadline: '10 июня', autoCheck: false },
    { id: 2, title: 'Квадратные уравнения',      subject: 'Математика',       status: 'review',  deadline: '8 июня',  autoCheck: false },
    { id: 3, title: 'Работа с API',              subject: 'Программирование', status: 'checked', deadline: '9 июня',  autoCheck: true  },
    { id: 4, title: 'Тригонометрия: синусы',     subject: 'Математика',       status: 'todo',    deadline: '12 июня', autoCheck: false },
    { id: 5, title: 'Тест: типы данных',         subject: 'Программирование', status: 'checked', deadline: '7 июня',  autoCheck: true  },
  ]);

  // Данные для Пробников
  const [mockExams] = useState([
    { id: 1, title: 'Вариант №1 (Май)', subject: 'Математика (профиль)', type: 'ЕГЭ', status: 'todo', deadline: '15 июня', autoCheck: true, score: null },
    { id: 2, title: 'Вариант №4 (Итоговый)', subject: 'Информатика', type: 'ЕГЭ', status: 'review', deadline: '5 июня', autoCheck: false, score: null },
    { id: 3, title: 'Демоверсия 2026', subject: 'Биология', type: 'ОГЭ', status: 'checked', deadline: '1 июня', autoCheck: true, score: '84/100' },
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
    setActiveTab(tab);
  };

  const handleStartExam = (id) => {
    alert(`Начало прохождения пробника №${id}.`);
  };

  if (!user) return <div className="loading">Загрузка...</div>;

  // Динамически формируем меню в зависимости от роли пользователя
  const navItems = [
    { key: 'home',            label: 'Главная' },
    // Показываем Тренажер ТОЛЬКО если пользователь — ученик (student)
    ...(user.role === 'student' ? [{ key: 'training', label: 'Тренажер' }] : []),
    { key: 'homework-list',   label: 'Домашняя работа' },
    { key: 'mock-exams',      label: 'Пробники' },
    { key: 'homework-status', label: user.role === 'teacher' ? 'Банк заданий' : 'Мои ошибки' },
    { key: 'schedule',        label: 'Расписание' },
    { key: 'profile',         label: 'Профиль' },
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

      case 'training':
        // Дополнительная защита, если вкладка вызвана напрямую
        if (user.role !== 'student') return <h2>Раздел недоступен для преподавателей</h2>;
        return <Trainer user={user} />;

      case 'homework-list':
                if (user.role === 'teacher') {
          return <TeacherHomework user={user} />;
          // Для реального приложения передайте список учеников:
          // return <TeacherHomework user={user} studentsData={students} />;
        }

        return <Homework user={user} homeworkData={homeworks} />;

      case 'schedule':
        return <Schedule />;

      case 'mock-exams':
        return (
          <div className="main-container">
            <div className="mock-exams-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2>Пробные варианты экзаменов</h2>
                <p style={{ color: '#666', fontSize: '14px', margin: '4px 0 0' }}>
                  {user.role === 'teacher' 
                    ? 'Составляйте структуры КИМ, назначайте учащимся и отслеживайте результаты.' 
                    : 'Решайте полноценные экзаменационные варианты с таймером и проверкой.'}
                </p>
              </div>
              {user.role === 'teacher' && (
                <button className="btn-create-exam" onClick={() => alert('Создание варианта...')}>
                  ＋ Сформировать вариант
                </button>
              )}
            </div>

            <div className="exams-grid">
              {mockExams.map(exam => (
                <div key={exam.id} className="exam-card">
                  <div className="exam-card-top">
                    <span className="exam-type-badge">{exam.type}</span>
                    <span className={`exam-status-badge ${exam.status}`}>
                      {exam.status === 'todo' && 'Не начат'}
                      {exam.status === 'review' && 'На проверке'}
                      {exam.status === 'checked' && 'Проверен'}
                    </span>
                  </div>
                  
                  <h3>{exam.title}</h3>
                  <p className="exam-subject">{exam.subject}</p>
                  
                  <div className="exam-meta-info">
                    <span className="exam-deadline">⏳ До: {exam.deadline}</span>
                    <span className="exam-check-type">
                      {exam.autoCheck ? '🤖 Автопроверка' : '👤 Проверка учителем'}
                    </span>
                  </div>

                  <div className="exam-card-actions" style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
                    {user.role === 'student' ? (
                      <>
                        {exam.status === 'todo' && (
                          <button className="btn-exam-action start" onClick={() => handleStartExam(exam.id)}>Начать тест</button>
                        )}
                        {exam.status === 'review' && (
                          <button className="btn-exam-action review" disabled>Ожидает проверки</button>
                        )}
                        {exam.status === 'checked' && (
                          <div className="exam-result-score">
                            <span>Результат:</span> <strong>{exam.score}</strong>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="teacher-exam-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '13px', color: '#666' }}>
                          {exam.status === 'todo' && 'Ученики еще решают'}
                          {exam.status === 'review' && '⚠️ Требует проверки'}
                          {exam.status === 'checked' && `Готово: ${exam.score}`}
                        </span>
                        <button className="btn-exam-action view-stats">
                          {exam.status === 'review' ? 'Проверить' : 'Результаты'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'homework-status':
        if (user.role === 'teacher') {
          return <TaskBank user={user} />;
        }
        // ПОЛНОСТЬЮ ВОССТАНОВЛЕННЫЙ КОД ОШИБОК ДЛЯ УЧЕНИКА
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
        // ПОЛНОСТЬЮ ВОССТАНОВЛЕННЫЙ КОД ПРОФИЛЯ С УСЛОВИЯМИ РОЛЕЙ
        return (
          <div className="profile-section">
            <h2>Мой профиль</h2>
            <div className="profile-info-card">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Имя:</strong> {user.first_name || '—'}</p>
              <p><strong>Фамилия:</strong> {user.last_name || '—'}</p>
              <p><strong>Роль:</strong> {user.role === 'teacher' ? 'Учитель' : 'Ученик'}</p>

              {user.role === 'teacher' && user.is_profile_filled && (
                <div style={{ marginTop: '15px' }}>
                  <p><strong>Преподаёт экзамены:</strong> {user.exam_type?.length > 0 ? user.exam_type.map(t => EXAM_LABELS[t] || t).join(', ') : '—'}</p>
                  <p><strong>Предметы:</strong> {user.subjects ? Object.values(user.subjects).flat().join(', ') : '—'}</p>
                </div>
              )}

              {user.role === 'teacher' && user.is_approved && (
                <div style={{
                  marginTop: '15px', padding: '15px',
                  background: 'rgba(0,208,132,0.1)', borderRadius: '12px', border: '2px solid #00d084',
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
                  marginTop: '15px', padding: '14px 16px',
                  background: 'rgba(255,193,7,0.1)', borderRadius: '12px',
                  border: '1px solid rgba(255,193,7,0.4)', fontSize: '14px', color: '#92600a',
                }}>
                  ⏳ Аккаунт ожидает подтверждения администратором
                </div>
              )}

              {user.role === 'student' && (
                <div style={{ marginTop: '15px' }}>
                  <p><strong>Экзамен:</strong> {user.exam_type?.length > 0 ? user.exam_type.map(t => EXAM_LABELS[t] || t).join(', ') : '—'}</p>
                  <p><strong>Предметы:</strong> {user.subjects && Object.keys(user.subjects).length > 0 ? Object.values(user.subjects).flat().join(', ') : '—'}</p>
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
      {showSetup && <SetupProfileModal onSave={handleSaveProfile} />}

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
                    opacity: 0.4, cursor: 'not-allowed', userSelect: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
                background: 'rgba(255,193,7,0.2)', color: '#92600a',
                fontSize: '12px', fontWeight: '600', padding: '4px 12px',
                borderRadius: '20px', border: '1px solid rgba(255,193,7,0.4)',
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