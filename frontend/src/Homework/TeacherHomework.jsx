import React, { useState, useRef, useEffect } from 'react';
import './TeacherHomework.css';

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

const API_BASE = 'http://localhost:8000/api';

// Получить токен из localStorage (стандарт для JWT-проектов)
const getToken = () => localStorage.getItem('access_token');

const authFetch = (url) =>
  fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });

// ── helpers ──────────────────────────────────────────────────────────────────
const initials    = (name) => (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const AVATAR_COLORS = [
  ['#E6F1FB','#0C447C'], ['#EAF3DE','#27500A'], ['#EEEDFE','#3C3489'],
  ['#E1F5EE','#085041'], ['#FAEEDA','#633806'], ['#FBEAF0','#72243E'],
];
const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// ── Мультиселект дропдаун ────────────────────────────────────────────────────
const StudentDropdown = ({ students, selected, onChange, loading }) => {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const ref               = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered     = students.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  const noneSelected = selected.size === 0;

  const toggle    = (id) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); onChange(n); };
  const toggleAll = ()   => onChange(new Set());
  const remove    = (id, e) => { e.stopPropagation(); const n = new Set(selected); n.delete(id); onChange(n); };

  const selectedList = students.filter(s => selected.has(s.id));

  return (
    <div className="student-dropdown" ref={ref}>
      <div
        className={`student-dropdown-trigger ${open ? 'open' : ''}`}
        onClick={() => !loading && setOpen(o => !o)}
        style={loading ? { opacity: 0.6, cursor: 'wait' } : {}}
      >
        {loading ? (
          <>
            <span className="sdt-avatar" style={{ background: '#f0f0f0', color: '#888' }}>⏳</span>
            <span className="sdt-label">Загрузка учеников...</span>
          </>
        ) : noneSelected ? (
          <>
            <span className="sdt-avatar" style={{ background: '#f0f0f0', color: '#888', fontSize: '14px' }}>👥</span>
            <span className="sdt-label">
              {students.length === 0 ? 'Нет учеников' : 'Все ученики'}
            </span>
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
          <span className="sdt-clear" onClick={(e) => { e.stopPropagation(); onChange(new Set()); }} title="Сбросить всё">×</span>
        )}
        <span className="sdt-chevron">{open ? '▲' : '▼'}</span>
      </div>

      {open && !loading && (
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

          <div className={`sdt-option ${noneSelected ? 'active' : ''}`} onClick={toggleAll}>
            <span className="sdt-opt-avatar" style={{ background: '#f0f0f0', color: '#888', fontSize: '14px' }}>👥</span>
            <span className="sdt-opt-name">Все ученики</span>
            <span className={`sdt-checkbox ${noneSelected ? 'checked' : ''}`}>{noneSelected ? '✓' : ''}</span>
          </div>

          <div className="sdt-divider" />

          <div className="sdt-list">
            {students.length === 0 ? (
              <div className="sdt-empty">У вас пока нет учеников.<br/>Поделитесь кодом из профиля.</div>
            ) : filtered.length === 0 ? (
              <div className="sdt-empty">Никого не найдено</div>
            ) : filtered.map(s => {
              const [sbg, sfg] = avatarColor(s.id);
              const isChecked  = selected.has(s.id);
              const pending    = s.homeworks?.filter(h => h.status === 'review').length || 0;
              return (
                <div key={s.id} className={`sdt-option ${isChecked ? 'active' : ''}`} onClick={() => toggle(s.id)}>
                  <span className="sdt-opt-avatar" style={{ background: sbg, color: sfg }}>{initials(s.name)}</span>
                  <span className="sdt-opt-name">{s.name}</span>
                  {pending > 0 && <span className="sdt-pending-badge">{pending}</span>}
                  <span className={`sdt-checkbox ${isChecked ? 'checked' : ''}`}>{isChecked ? '✓' : ''}</span>
                </div>
              );
            })}
          </div>

          <div className="sdt-footer">
            <span className="sdt-footer-count">
              {noneSelected ? `Всего: ${students.length}` : `Выбрано: ${selected.size}`}
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
const TeacherHomework = ({ user }) => {
  const teacherExams = Array.isArray(user?.exam_type) && user.exam_type.length > 0
    ? user.exam_type
    : ['ege'];
  const examLabels = { ege: 'ЕГЭ', oge: 'ОГЭ' };

  const [activeExam,       setActiveExam]       = useState(teacherExams[0]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [activeSubject,    setActiveSubject]    = useState(null);

  // Данные из API
  const [studentsData, setStudentsData] = useState([]);  // [{id, name, examType, subjects, homeworks}]
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingHomeworks, setLoadingHomeworks] = useState(false);
  const [error, setError] = useState(null);

  // 1. Загружаем список учеников учителя
  useEffect(() => {
    setLoadingStudents(true);
    authFetch(`${API_BASE}/teacher/students/`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        // data: [{id, first_name, last_name, exam_type, subjects, ...}]
        const mapped = data.map(s => ({
          id:       s.id,
          name:     `${s.last_name} ${s.first_name}`.trim() || s.username || s.email,
          examType: Array.isArray(s.exam_type) ? s.exam_type[0] : s.exam_type || 'oge',
          // subjects — словарь {"oge": [...], "ege": [...]} или массив
          subjects: Array.isArray(s.subjects)
            ? s.subjects
            : Object.values(s.subjects || {}).flat(),
          homeworks: [],  // загружаем отдельно
        }));
        setStudentsData(mapped);
        setLoadingStudents(false);
      })
      .catch(err => {
        console.error('Ошибка загрузки учеников:', err);
        setError('Не удалось загрузить учеников');
        setLoadingStudents(false);
      });
  }, []);

  // 2. Загружаем домашки всех учеников (одним запросом)
  useEffect(() => {
    if (studentsData.length === 0) return;
    setLoadingHomeworks(true);
    authFetch(`${API_BASE}/teacher/homeworks/`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        // data: [{id, title, subject, status, deadline, auto_check, grade, student_id}]
        setStudentsData(prev => prev.map(s => ({
          ...s,
          homeworks: data
            .filter(hw => hw.student_id === s.id)
            .map(hw => ({
              id:        hw.id,
              title:     hw.title,
              subject:   hw.subject,
              status:    hw.status,           // 'todo' | 'review' | 'checked'
              deadline:  hw.deadline ? formatDate(hw.deadline) : null,
              autoCheck: hw.auto_check || false,
              grade:     hw.grade || null,
            })),
        })));
        setLoadingHomeworks(false);
      })
      .catch(err => {
        console.error('Ошибка загрузки домашек:', err);
        setLoadingHomeworks(false);
      });
  }, [studentsData.length]);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    } catch { return iso; }
  };

  const handleExamChange = (exam) => {
    setActiveExam(exam);
    setSelectedStudents(new Set());
    setActiveSubject(null);
  };

  const handleStudentsChange = (newSet) => {
    setSelectedStudents(newSet);
    setActiveSubject(null);
  };

  // Ученики текущего типа экзамена
  const filteredStudents = studentsData.filter(s => s.examType === activeExam);

  // Предметы по выбранным ученикам
  const visibleStudents = selectedStudents.size === 0
    ? filteredStudents
    : filteredStudents.filter(s => selectedStudents.has(s.id));

  const subjectsForFilter = [...new Set(visibleStudents.flatMap(s => s.subjects))];

  // Домашки
  const allHomeworks = filteredStudents.flatMap(s =>
    (s.homeworks || []).map(hw => ({ ...hw, studentId: s.id, studentName: s.name }))
  );

  const visibleHw = allHomeworks.filter(hw => {
    const byStudent = selectedStudents.size === 0 || selectedStudents.has(hw.studentId);
    const bySubject = !activeSubject || hw.subject === activeSubject;
    return byStudent && bySubject;
  });

  const reviewTasks  = visibleHw.filter(h => h.status === 'review');
  const checkedTasks = visibleHw.filter(h => h.status === 'checked');
  const showStudentName = selectedStudents.size !== 1;

  const handleCheck = (hw) => {
    // Здесь можно открыть модалку проверки
    alert(`Проверка: «${hw.title}» — ${hw.studentName}`);
  };

  if (error) return (
    <div className="main-container">
      <div style={{ padding: '40px', textAlign: 'center', color: '#e74c3c' }}>
        ⚠️ {error}
      </div>
    </div>
  );

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
          <span className="stat-value" style={{ color: '#e67e22' }}>
            {loadingHomeworks ? '…' : reviewTasks.length}
          </span>
        </div>
        <div className="stat-card checked-border">
          <span className="stat-label">Проверено</span>
          <span className="stat-value">
            {loadingHomeworks ? '…' : checkedTasks.length}
          </span>
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
            loading={loadingStudents}
          />
        </div>

        {subjectsForFilter.length > 0 && (
          <div className="teacher-filter-group teacher-filter-group--subjects">
            <span className="filter-label">Предмет</span>
            <div className="tabs-header" style={{ marginBottom: 0 }}>
              <button className={`tab-button ${!activeSubject ? 'active' : ''}`} onClick={() => setActiveSubject(null)}>Все</button>
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
          {loadingHomeworks
            ? <p className="hw-empty">Загрузка...</p>
            : reviewTasks.length === 0
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
          {loadingHomeworks
            ? <p className="hw-empty">Загрузка...</p>
            : checkedTasks.length === 0
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