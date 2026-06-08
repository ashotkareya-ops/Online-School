import React, { useState, useRef, useEffect } from 'react';

const SUBJECT_COLORS = {
  'Математика':               { bg: '#E6F1FB', color: '#0C447C' },
  'Математика (профильный)':  { bg: '#dbeafe', color: '#1e40af' },
  'Программирование':         { bg: '#EAF3DE', color: '#27500A' },
  'Информатика':              { bg: '#EEEDFE', color: '#3C3489' },
  'Биология':                 { bg: '#E1F5EE', color: '#085041' },
  'Физика':                   { bg: '#FAEEDA', color: '#633806' },
  'Химия':                    { bg: '#FAECE7', color: '#712B13' },
  'История':                  { bg: '#FBEAF0', color: '#72243E' },
};

const MOCK_STUDENTS = [
  { id: 1,  name: 'Иванова Маша',   examType: 'ege', subjects: ['Математика (профильный)', 'Информатика'],
    homeworks: [
      { id: 10, title: 'Производная сложной функции', subject: 'Математика (профильный)', status: 'review',  deadline: '9 июня',  autoCheck: false },
      { id: 11, title: 'Алгоритмы сортировки',        subject: 'Информатика',             status: 'review',  deadline: '10 июня', autoCheck: false },
      { id: 12, title: 'Интегралы: практика',         subject: 'Математика (профильный)', status: 'checked', deadline: '5 июня',  autoCheck: false, grade: '9/10' },
      { id: 13, title: 'SQL-запросы',                 subject: 'Информатика',             status: 'checked', deadline: '3 июня',  autoCheck: true,  grade: '10/10' },
    ],
  },
  { id: 2,  name: 'Петров Сёма',    examType: 'ege', subjects: ['Математика (профильный)', 'Физика'],
    homeworks: [
      { id: 20, title: 'Тригонометрические уравнения', subject: 'Математика (профильный)', status: 'review',  deadline: '8 июня', autoCheck: false },
      { id: 21, title: 'Законы Ньютона — задачи',      subject: 'Физика',                  status: 'checked', deadline: '4 июня', autoCheck: false, grade: '7/10' },
      { id: 22, title: 'Логарифмы: тест',              subject: 'Математика (профильный)', status: 'checked', deadline: '2 июня', autoCheck: true,  grade: '8/10' },
    ],
  },
  { id: 3,  name: 'Смирнова Катя',  examType: 'ege', subjects: ['Математика (профильный)', 'Физика'],
    homeworks: [
      { id: 23, title: 'Графики функций',      subject: 'Математика (профильный)', status: 'review',  deadline: '12 июня', autoCheck: false },
      { id: 24, title: 'Электростатика: тест', subject: 'Физика',                  status: 'checked', deadline: '6 июня',  autoCheck: true,  grade: '9/10' },
    ],
  },
  { id: 4,  name: 'Лебедев Артём',  examType: 'ege', subjects: ['Информатика'],
    homeworks: [
      { id: 25, title: 'Рекурсия и стек', subject: 'Информатика', status: 'review',  deadline: '11 июня', autoCheck: false },
      { id: 26, title: 'Бинарный поиск',  subject: 'Информатика', status: 'checked', deadline: '4 июня',  autoCheck: true,  grade: '10/10' },
    ],
  },
  { id: 5,  name: 'Новикова Диана', examType: 'ege', subjects: ['Математика (профильный)', 'Информатика'],
    homeworks: [
      { id: 27, title: 'Теория вероятностей', subject: 'Математика (профильный)', status: 'review', deadline: '13 июня', autoCheck: false },
    ],
  },
  { id: 6,  name: 'Козлов Митя',    examType: 'oge', subjects: ['Математика', 'История'],
    homeworks: [
      { id: 40, title: 'Дроби и проценты',       subject: 'Математика', status: 'checked', deadline: '7 июня',  autoCheck: true,  grade: '4/5' },
      { id: 41, title: 'Реформы Петра I — эссе', subject: 'История',    status: 'review',  deadline: '10 июня', autoCheck: false },
    ],
  },
  { id: 7,  name: 'Сидорова Аня',   examType: 'oge', subjects: ['Математика', 'Биология'],
    homeworks: [
      { id: 30, title: 'Линейные уравнения',           subject: 'Математика', status: 'review',  deadline: '11 июня', autoCheck: false },
      { id: 31, title: 'Клетка: строение и функции',   subject: 'Биология',   status: 'review',  deadline: '9 июня',  autoCheck: false },
      { id: 32, title: 'Геометрия: задачи на площадь', subject: 'Математика', status: 'checked', deadline: '6 июня',  autoCheck: false, grade: '5/5' },
    ],
  },
  { id: 8,  name: 'Орлова Вика',    examType: 'oge', subjects: ['Биология', 'История'],
    homeworks: [
      { id: 42, title: 'Фотосинтез',      subject: 'Биология', status: 'review',  deadline: '9 июня', autoCheck: false },
      { id: 43, title: 'ВОВ: хронология', subject: 'История',  status: 'checked', deadline: '5 июня', autoCheck: false, grade: '4/5' },
    ],
  },
  { id: 9,  name: 'Тихонов Паша',   examType: 'oge', subjects: ['Математика'],
    homeworks: [
      { id: 44, title: 'Уравнения с модулем',    subject: 'Математика', status: 'review',  deadline: '12 июня', autoCheck: false },
      { id: 45, title: 'Координатная плоскость', subject: 'Математика', status: 'checked', deadline: '3 июня',  autoCheck: true,  grade: '5/5' },
    ],
  },
  { id: 10, name: 'Белова Настя',   examType: 'oge', subjects: ['Математика', 'Биология'],
    homeworks: [
      { id: 46, title: 'Степени и корни',          subject: 'Математика', status: 'checked', deadline: '6 июня',  autoCheck: true,  grade: '3/5' },
      { id: 47, title: 'Эволюция: теория Дарвина', subject: 'Биология',   status: 'review',  deadline: '14 июня', autoCheck: false },
    ],
  },
];

const initials    = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const AVATAR_COLORS = [
  ['#E6F1FB','#0C447C'], ['#EAF3DE','#27500A'], ['#EEEDFE','#3C3489'],
  ['#E1F5EE','#085041'], ['#FAEEDA','#633806'], ['#FBEAF0','#72243E'],
];
const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// ── Мультиселект дропдаун ────────────────────────────────────────────────────
const StudentDropdown = ({ students, selected, onChange }) => {
  // selected: Set of ids  (пустой Set = "все")
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const ref               = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered   = students.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  const noneSelected = selected.size === 0;

  // Тоггл одного ученика
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  };

  // Выбрать всех / снять всех
  const toggleAll = () => {
    onChange(new Set()); // пустой = "Все"
  };

  // Снять конкретного из тега
  const remove = (id, e) => {
    e.stopPropagation();
    const next = new Set(selected);
    next.delete(id);
    onChange(next);
  };

  // Подпись на триггере
  const selectedList = students.filter(s => selected.has(s.id));

  return (
    <div className="student-dropdown" ref={ref}>
      {/* ── Триггер ── */}
      <div
        className={`student-dropdown-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {noneSelected ? (
          <>
            <span className="sdt-avatar" style={{ background: '#f0f0f0', color: '#888', fontSize: '14px' }}>👥</span>
            <span className="sdt-label">Все ученики</span>
          </>
        ) : (
          <div className="sdt-tags">
            {selectedList.map(s => {
              const [bg, fg] = avatarColor(s.id);
              return (
                <span key={s.id} className="sdt-tag" style={{ background: bg, color: fg }}>
                  {initials(s.name)}
                  <span className="sdt-tag-name">{s.name.split(' ')[0]}</span>
                  <span className="sdt-tag-remove" onClick={(e) => remove(s.id, e)}>×</span>
                </span>
              );
            })}
          </div>
        )}
        {!noneSelected && (
          <span
            className="sdt-clear"
            onClick={(e) => { e.stopPropagation(); onChange(new Set()); }}
            title="Сбросить всё"
          >×</span>
        )}
        <span className="sdt-chevron">{open ? '▲' : '▼'}</span>
      </div>

      {/* ── Меню ── */}
      {open && (
        <div className="student-dropdown-menu">
          <div className="sdt-search-wrap">
            <input
              className="sdt-search"
              placeholder="Поиск ученика..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* "Все" */}
          <div
            className={`sdt-option ${noneSelected ? 'active' : ''}`}
            onClick={toggleAll}
          >
            <span className="sdt-opt-avatar" style={{ background: '#f0f0f0', color: '#888', fontSize: '14px' }}>👥</span>
            <span className="sdt-opt-name">Все ученики</span>
            <span className={`sdt-checkbox ${noneSelected ? 'checked' : ''}`}>{noneSelected ? '✓' : ''}</span>
          </div>

          <div className="sdt-divider" />

          <div className="sdt-list">
          {filtered.length === 0
            ? <div className="sdt-empty">Никого не найдено</div>
            : filtered.map(s => {
                const [sbg, sfg] = avatarColor(s.id);
                const isChecked  = selected.has(s.id);
                const pending    = s.homeworks.filter(h => h.status === 'review').length;
                return (
                  <div
                    key={s.id}
                    className={`sdt-option ${isChecked ? 'active' : ''}`}
                    onClick={() => toggle(s.id)}
                  >
                    <span className="sdt-opt-avatar" style={{ background: sbg, color: sfg }}>
                      {initials(s.name)}
                    </span>
                    <span className="sdt-opt-name">{s.name}</span>
                    {pending > 0 && <span className="sdt-pending-badge">{pending}</span>}
                    <span className={`sdt-checkbox ${isChecked ? 'checked' : ''}`}>{isChecked ? '✓' : ''}</span>
                  </div>
                );
              })
          }
          </div>

          {/* Нижняя панель — счётчик + закрыть */}
          <div className="sdt-footer">
            <span className="sdt-footer-count">
              {noneSelected ? 'Показаны все' : `Выбрано: ${selected.size}`}
            </span>
            <button className="sdt-footer-done" onClick={() => setOpen(false)}>Готово</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Карточка задания ─────────────────────────────────────────────────────────
const HwCard = ({ hw, onCheck }) => {
  const col = SUBJECT_COLORS[hw.subject] || { bg: '#F1EFE8', color: '#444441' };
  return (
    <div className="hw-item-card">
      <div className="hw-item-top">
        <p className="hw-item-title">{hw.title}</p>
        {hw.autoCheck && <span className="hw-auto-badge">Авто</span>}
      </div>
      <div className="hw-item-meta">
        <span className="hw-subject-badge" style={{ background: col.bg, color: col.color }}>{hw.subject}</span>
        {hw.deadline && <span className="hw-deadline">до {hw.deadline}</span>}
      </div>
      {hw.status === 'checked' && hw.grade && (
        <div className="hw-grade-row">
          <span className="hw-grade-label">Оценка:</span>
          <span className="hw-grade-value">{hw.grade}</span>
        </div>
      )}
      {hw.status === 'review' && !hw.autoCheck && (
        <button className="btn-hw-check" onClick={() => onCheck && onCheck(hw)}>Проверить</button>
      )}
    </div>
  );
};

// ── Основной компонент ───────────────────────────────────────────────────────
const TeacherHomework = ({ user, studentsData = MOCK_STUDENTS }) => {
  const teacherExams = user?.exam_type || ['ege', 'oge'];
  const examLabels   = { ege: 'ЕГЭ', oge: 'ОГЭ' };

  const [activeExam,     setActiveExam]     = useState(teacherExams[0] || 'ege');
  const [selectedStudents, setSelectedStudents] = useState(new Set()); // пустой = все
  const [activeSubject,  setActiveSubject]  = useState(null);

  const filteredStudents = studentsData.filter(s => s.examType === activeExam);

  const handleExamChange = (exam) => {
    setActiveExam(exam);
    setSelectedStudents(new Set());
    setActiveSubject(null);
  };

  const handleStudentsChange = (newSet) => {
    setSelectedStudents(newSet);
    setActiveSubject(null);
  };

  // Предметы — объединение предметов выбранных учеников (или всех)
  const visibleStudents = selectedStudents.size === 0
    ? filteredStudents
    : filteredStudents.filter(s => selectedStudents.has(s.id));

  const subjectsForFilter = [...new Set(visibleStudents.flatMap(s => s.subjects))];

  const allHomeworks = filteredStudents.flatMap(s =>
    s.homeworks.map(hw => ({ ...hw, studentId: s.id, studentName: s.name }))
  );

  const visibleHw = allHomeworks.filter(hw => {
    const byStudent = selectedStudents.size === 0 || selectedStudents.has(hw.studentId);
    const bySubject = !activeSubject || hw.subject === activeSubject;
    return byStudent && bySubject;
  });

  const reviewTasks  = visibleHw.filter(h => h.status === 'review');
  const checkedTasks = visibleHw.filter(h => h.status === 'checked');

  // Показывать имя ученика над карточкой, если выбрано несколько (или все)
  const showStudentName = selectedStudents.size !== 1;

  const handleCheck = (hw) => alert(`Открываем проверку: «${hw.title}» — ${hw.studentName}`);

  return (
    <div className="main-container">

      {/* ── ОГЭ / ЕГЭ ── */}
      {teacherExams.length > 1 && (
        <div className="teacher-exam-switcher">
          {teacherExams.map(exam => (
            <button
              key={exam}
              className={`exam-switch-btn ${activeExam === exam ? 'active' : ''}`}
              onClick={() => handleExamChange(exam)}
            >
              {examLabels[exam] || exam.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* ── Статистика ── */}
      <div className="stats-container">
        <div className="stat-card review-border">
          <span className="stat-label">Нужно проверить</span>
          <span className="stat-value" style={{ color: '#e67e22' }}>{reviewTasks.length}</span>
        </div>
        <div className="stat-card checked-border">
          <span className="stat-label">Проверено</span>
          <span className="stat-value">{checkedTasks.length}</span>
        </div>
      </div>

      {/* ── Фильтры ── */}
      <div className="teacher-filters-row">
        <div className="teacher-filter-group">
          <span className="filter-label">Ученики</span>
          <StudentDropdown
            students={filteredStudents}
            selected={selectedStudents}
            onChange={handleStudentsChange}
          />
        </div>

        {subjectsForFilter.length > 0 && (
          <div className="teacher-filter-group teacher-filter-group--subjects">
            <span className="filter-label">Предмет</span>
            <div className="tabs-header" style={{ marginBottom: 0 }}>
              <button
                className={`tab-button ${!activeSubject ? 'active' : ''}`}
                onClick={() => setActiveSubject(null)}
              >Все</button>
              {subjectsForFilter.map(subj => (
                <button
                  key={subj}
                  className={`tab-button ${activeSubject === subj ? 'active' : ''}`}
                  onClick={() => setActiveSubject(subj)}
                >{subj}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Колонки ── */}
      <div className="homework-grid homework-grid--2">
        <div className="homework-column">
          <h3 className="column-title">
            Нужно проверить
            <span className="column-hint">ждёт вашей оценки</span>
          </h3>
          {reviewTasks.length === 0
            ? <p className="hw-empty">Всё проверено 🎉</p>
            : reviewTasks.map(hw => (
                <div key={hw.id}>
                  {showStudentName && <p className="hw-student-name">{hw.studentName}</p>}
                  <HwCard hw={hw} onCheck={handleCheck} />
                </div>
              ))
          }
        </div>

        <div className="homework-column">
          <h3 className="column-title">
            Проверено
            <span className="column-hint">результат отправлен</span>
          </h3>
          {checkedTasks.length === 0
            ? <p className="hw-empty">Нет проверенных</p>
            : checkedTasks.map(hw => (
                <div key={hw.id}>
                  {showStudentName && <p className="hw-student-name">{hw.studentName}</p>}
                  <HwCard hw={hw} />
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
};

export default TeacherHomework;