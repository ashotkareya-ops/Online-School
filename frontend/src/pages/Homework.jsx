import React, { useState } from 'react';

const SUBJECT_COLORS = {
  'Математика':       { bg: '#E6F1FB', color: '#0C447C' },
  'Программирование': { bg: '#EAF3DE', color: '#27500A' },
  'Информатика':      { bg: '#EEEDFE', color: '#3C3489' },
  'Биология':         { bg: '#E1F5EE', color: '#085041' },
  'Физика':           { bg: '#FAEEDA', color: '#633806' },
  'Химия':            { bg: '#FAECE7', color: '#712B13' },
  'История':          { bg: '#FBEAF0', color: '#72243E' },
};

// Одна карточка задания
const HwCard = ({ hw }) => {
  const col = SUBJECT_COLORS[hw.subject] || { bg: '#F1EFE8', color: '#444441' };
  return (
    <div className="hw-item-card">
      <div className="hw-item-top">
        <p className="hw-item-title">{hw.title}</p>
        {/* Бейдж "Авто" только на автопроверяемых заданиях */}
        {hw.autoCheck && (
          <span className="hw-auto-badge">Авто</span>
        )}
      </div>
      <div className="hw-item-meta">
        <span className="hw-subject-badge" style={{ background: col.bg, color: col.color }}>
          {hw.subject}
        </span>
        {hw.deadline && (
          <span className="hw-deadline">до {hw.deadline}</span>
        )}
      </div>
    </div>
  );
};

const Homework = ({ user, homeworkData = [] }) => {
  // Берём предметы из профиля ученика
  const userSubjects = user?.subjects
    ? Object.values(user.subjects).flat()
    : [];

  // Если предмет один — не показываем вкладку "Все", сразу активируем единственный предмет
  const subjects = userSubjects.length > 1 ? ['Все', ...userSubjects] : userSubjects;
  const [activeSubject, setActiveSubject] = useState(subjects[0] || 'Все');

  const filtered = activeSubject === 'Все'
    ? homeworkData
    : homeworkData.filter(h => h.subject === activeSubject);

  // Три статуса:
  // 'todo'    — не сделано
  // 'review'  — отправлено, ждёт учителя (autoCheck: false)
  // 'checked' — проверено (учителем или автоматически)
  const todoTasks    = filtered.filter(h => h.status === 'todo');
  const reviewTasks  = filtered.filter(h => h.status === 'review');
  const checkedTasks = filtered.filter(h => h.status === 'checked');

  return (
    <div className="main-container">

      {/* Статистика */}
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

      {/* Вкладки предметов — скрыты если предмет только один */}
      {subjects.length > 1 && (
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
      )}

      {/* Три колонки */}
      <div className="homework-grid homework-grid--3">

        <div className="homework-column">
          <h3 className="column-title">К выполнению</h3>
          {todoTasks.length === 0
            ? <p className="hw-empty">Нет заданий</p>
            : todoTasks.map(hw => <HwCard key={hw.id} hw={hw} />)
          }
        </div>

        <div className="homework-column">
          <h3 className="column-title">
            Отправленные
            <span className="column-hint">ждёт учителя</span>
          </h3>
          {reviewTasks.length === 0
            ? <p className="hw-empty">Нет заданий</p>
            : reviewTasks.map(hw => <HwCard key={hw.id} hw={hw} />)
          }
        </div>

        <div className="homework-column">
          <h3 className="column-title">
            Проверенные
            <span className="column-hint">результат получен</span>
          </h3>
          {checkedTasks.length === 0
            ? <p className="hw-empty">Нет заданий</p>
            : checkedTasks.map(hw => <HwCard key={hw.id} hw={hw} />)
          }
        </div>

      </div>
    </div>
  );
};

export default Homework;