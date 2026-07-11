import React, { useState, useRef, useEffect } from 'react';
import './TeacherHomework.css';
import '../components/Trainer/Trainer.css'

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
const HwCard = ({ hw, onCheck, onPreview, onView }) => {
  const col = SUBJECT_COLORS[hw.subject] || { bg: '#F1EFE8', color: '#444441' };
  return (
    <div className="hw-item-card">
      <div className="hw-item-top">
        <p className="hw-item-title">{hw.title}</p>
        {hw.autoCheck && (
          <span className="hw-auto-badge">
            <span className="hw-auto-badge-icon">⚡</span> Авто
          </span>
        )}
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
      {hw.status === 'review' && (
        <button className="btn-hw-check" onClick={() => onCheck && onCheck(hw)}>
          {hw.autoCheck ? 'Посмотреть' : 'Проверить'}
        </button>
      )}
      {hw.status === 'sent' && (
        <>
          <span className="hw-sent-hint">⏳ Ожидает выполнения учеником</span>
          <button className="btn-hw-preview" onClick={() => onPreview && onPreview(hw)}>
            Посмотреть задания
          </button>
        </>
      )}
      {hw.status === 'checked' && (
        <button className="btn-hw-view" onClick={() => onView && onView(hw)}>
          Посмотреть результат
        </button>
      )}
    </div>
  );
};

// ── Карточка задания в режиме проверки/просмотра (учитель) ──────────────────
const ReviewTaskCard = ({ task, index, verdict, onVerdict, cardRef, readOnly, notSolved }) => {
  const autoChecked = task.autoCheck !== false && task.isCorrect !== null && task.isCorrect !== undefined;
  const isCorrect   = autoChecked ? task.isCorrect : verdict === 'correct';
  const isWrong     = autoChecked ? !task.isCorrect : verdict === 'wrong';

  return (
    <div className="tr-solve-card" ref={cardRef}>
      <div className="tr-solve-card__num">{index + 1}</div>
      <div className="tr-solve-card__body">
        <div className="tr-solve-card__meta">
          {task.subtype_name && <span className="tr-solve-tag">{task.subtype_name}</span>}
          {task.diff && (
            <span className="tr-solve-tag tr-solve-tag--diff">
              {task.diff === 1 ? 'Лёгкое' : task.diff === 2 ? 'Среднее' : 'Сложное'}
            </span>
          )}
        </div>

        {task.text && <p className="tr-solve-card__text">{task.text}</p>}
        {task.taskImage && (
          <img src={task.taskImage} alt="Условие" className="tr-solve-card__img" />
        )}

        {task.steps?.length > 0 && (
          <div className="tr-solve-card__steps">
            {task.steps.map((step, si) => (
              <div key={si} className="tr-solve-step">
                {step.text && <p className="tr-solve-step__text">{step.text}</p>}
                {(step.image || step.image_url) && (
                  <img
                    src={step.image || step.image_url}
                    alt={`Шаг ${si + 1}`}
                    className="tr-solve-step__img"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Ответ ученика — как tr-answer-wrap, но нередактируемый */}
        {notSolved ? (
          <div className="tr-answer-wrap hw-review-answer hw-review-answer--pending">
            <label className="tr-answer-label">Ответ ученика:</label>
            <span className="hw-review-answer-value hw-review-answer-value--pending">Ещё не решено</span>
          </div>
        ) : (
          <div className={`tr-answer-wrap hw-review-answer ${isCorrect ? 'hw-review-answer--correct' : ''} ${isWrong ? 'hw-review-answer--wrong' : ''}`}>
            <label className="tr-answer-label">Ответ ученика:</label>
            <span className="hw-review-answer-value">{task.studentAnswer?.trim() || '—'}</span>
            {autoChecked && (
              <span className={`hw-auto-verdict ${task.isCorrect ? 'ok' : 'bad'}`}>
                {task.isCorrect ? '✓ Верно' : '✗ Неверно'}
              </span>
            )}
          </div>
        )}

        {/* Ручная проверка: активная (учитель ставит вердикт) или read-only (только показ уже поставленного) */}
        {!autoChecked && !notSolved && readOnly && (
          <div className="hw-manual-verdict hw-manual-verdict--readonly">
            <span className="hw-manual-verdict-label">Вердикт учителя:</span>
            <span className={`hw-verdict-static ${verdict === 'correct' ? 'ok' : verdict === 'wrong' ? 'bad' : ''}`}>
              {verdict === 'correct' ? '✓ Верно' : verdict === 'wrong' ? '✗ Неверно' : '—'}
            </span>
          </div>
        )}
        {!autoChecked && !notSolved && !readOnly && (
          <div className="hw-manual-verdict">
            <span className="hw-manual-verdict-label">Проверка учителя:</span>
            <button
              type="button"
              className={`hw-verdict-btn hw-verdict-btn--ok ${verdict === 'correct' ? 'active' : ''}`}
              onClick={() => onVerdict('correct')}
            >✓ Верно</button>
            <button
              type="button"
              className={`hw-verdict-btn hw-verdict-btn--bad ${verdict === 'wrong' ? 'active' : ''}`}
              onClick={() => onVerdict('wrong')}
            >✗ Неверно</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Экран проверки/просмотра ДЗ (точь-в-точь как экран решения в Trainer) ────
// mode: 'review' (по умолчанию, проверка и выставление оценки) |
//       'preview' (ДЗ отправлено, ученик ещё не решал — только условия) |
//       'readonly' (ДЗ уже проверено — финальный результат без возможности править)
const HomeworkReviewScreen = ({ hwMeta, data, loading, error, onBack, onFinish, finishing, mode = 'review' }) => {
  const [verdicts, setVerdicts] = useState({});
  const [grade,    setGrade]    = useState(null);
  const cardRefs = useRef({});

  useEffect(() => {
    setVerdicts(mode === 'readonly' ? (data?.savedVerdicts || {}) : {});
    setGrade(mode === 'readonly' ? (hwMeta?.grade || null) : null);
  }, [hwMeta?.id, mode]);

  const tasks = data?.tasks || [];
  const isPreview  = mode === 'preview';
  const isReadOnly = mode === 'readonly';
  const manualTasks = tasks.filter(t => !(t.autoCheck !== false && t.isCorrect !== null && t.isCorrect !== undefined));
  const manualDone   = manualTasks.filter(t => verdicts[t.id]).length;
  const allManualDone = manualTasks.length === 0 || manualDone === manualTasks.length;
  const canFinish = !isPreview && !isReadOnly && allManualDone && !!grade && !finishing;

  const setVerdict = (taskId, v) => setVerdicts(prev => ({ ...prev, [taskId]: v }));

  const handleFinish = () => {
    if (!canFinish) return;
    onFinish({ grade, verdicts });
  };

  const screenTitle = isPreview ? 'Условия ДЗ' : isReadOnly ? 'Результат ДЗ' : null;

  return (
    <div className="tr-screen">
      <button className="tr-back-btn" onClick={onBack}>← Назад к списку</button>

      {/* ── Липкая шапка, как у Trainer на экране решения ── */}
      <div className="tr-solve-sticky">
        <div className="tr-solve-sticky-row">
          <div className="tr-solve-sticky-left">
            <div className="tr-solve-sticky-info">
              <span className="tr-solve-sticky-title">
                {hwMeta?.title}
                {screenTitle && <span className="hw-mode-badge">{screenTitle}</span>}
              </span>
              <span className="tr-solve-sticky-sub">
                {hwMeta?.studentName}{hwMeta?.subject ? ` · ${hwMeta.subject}` : ''}
                {isPreview && hwMeta?.deadline ? ` · до ${hwMeta.deadline}` : ''}
                {isReadOnly && hwMeta?.grade ? ` · оценка ${hwMeta.grade}` : ''}
              </span>
            </div>
          </div>

          {!isPreview && !isReadOnly && manualTasks.length > 0 && (
            <div className="tr-dots">
              {tasks.map((t, i) => (
                <div
                  key={t.id}
                  className={`tr-dot ${verdicts[t.id] ? 'answered' : ''}`}
                  onClick={() => cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  title={`Задание ${i + 1}`}
                />
              ))}
            </div>
          )}

          {!isPreview && !isReadOnly && (
            <button
              className="tr-generate-btn"
              onClick={handleFinish}
              disabled={!canFinish}
              style={{ flexShrink: 0 }}
            >
              {finishing ? 'Сохранение...' : 'Закончить проверку →'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="tr-loading">Загрузка...</div>
      ) : error ? (
        <div className="tr-empty">
          <span className="tr-empty-icon">⚠️</span>
          <p>{error}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="tr-empty">
          <span className="tr-empty-icon">📋</span>
          <p>{isPreview ? 'В этом ДЗ пока нет заданий.' : 'В этом задании пока нет решений.'}</p>
        </div>
      ) : (
        <>
          <div className="tr-solve-list">
            {tasks.map((task, i) => (
              <ReviewTaskCard
                key={task.id}
                task={task}
                index={i}
                verdict={verdicts[task.id]}
                onVerdict={(v) => setVerdict(task.id, v)}
                cardRef={el => { cardRefs.current[i] = el; }}
                readOnly={isReadOnly}
                notSolved={isPreview}
              />
            ))}
          </div>

          {!isPreview && !isReadOnly && (
            <>
              {/* ── Нижняя панель: выставление оценки ── */}
              <div className="tr-footer">
                <div className="hw-grade-picker">
                  <span className="hw-grade-picker-label">Оценка:</span>
                  {[2, 3, 4, 5].map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`hw-grade-btn ${grade === g ? 'active' : ''}`}
                      onClick={() => setGrade(g)}
                    >{g}</button>
                  ))}
                </div>
                <button
                  className="tr-generate-btn"
                  onClick={handleFinish}
                  disabled={!canFinish}
                >
                  {finishing ? 'Сохранение...' : 'Закончить проверку →'}
                </button>
              </div>
              {!allManualDone && (
                <p className="hw-review-hint">Отметьте вердикт для всех заданий, требующих ручной проверки.</p>
              )}
              {allManualDone && !grade && (
                <p className="hw-review-hint">Выберите итоговую оценку, чтобы завершить проверку.</p>
              )}
            </>
          )}
        </>
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

  // ── ДЕМО-ДАННЫЕ ДЛЯ ТЕСТИРОВАНИЯ И ВЕРСТКИ ──
  const [studentsData, setStudentsData] = useState([
    {
      id: 1,
      name: "Алексеев Александр",
      examType: "ege",
      subjects: ["Математика"],
      homeworks: [
        {
          id: 991,
          title: "Логарифмические уравнения и неравенства",
          subject: "Математика",
          status: "review",
          deadline: "15 июля",
          autoCheck: false,
          grade: null,
        }
      ]
    },
    {
      id: 2,
      name: "Иванова Мария",
      examType: "ege",
      subjects: ["Информатика"],
      homeworks: [
        {
          id: 992,
          title: "Задание 24: Обработка символьных строк",
          subject: "Информатика",
          status: "checked",
          deadline: "5 июля",
          autoCheck: true,
          grade: 5,
        }
      ]
    }
  ]);  
  const [loadingStudents, setLoadingStudents] = useState(false); 
  const [loadingHomeworks, setLoadingHomeworks] = useState(false); 
  const [error, setError] = useState(null);

  useEffect(() => {
    if (studentsData.length === 0) return;
    setLoadingHomeworks(true);
    authFetch(`${API_BASE}/teacher/homeworks/`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setStudentsData(prev => prev.map(s => ({
          ...s,
          homeworks: data
            .filter(hw => hw.student_id === s.id)
            .map(hw => ({
              id:        hw.id,
              title:     hw.title,
              subject:   hw.subject,
              status:    hw.status, 
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

  const filteredStudents = studentsData.filter(s => s.examType === activeExam);

  const visibleStudents = selectedStudents.size === 0
    ? filteredStudents
    : filteredStudents.filter(s => selectedStudents.has(s.id));

  const subjectsForFilter = [...new Set(visibleStudents.flatMap(s => s.subjects))];

  const allHomeworks = filteredStudents.flatMap(s =>
    (s.homeworks || []).map(hw => ({ ...hw, studentId: s.id, studentName: s.name }))
  );

  const visibleHw = allHomeworks.filter(hw => {
    const byStudent = selectedStudents.size === 0 || selectedStudents.has(hw.studentId);
    const bySubject = !activeSubject || hw.subject === activeSubject;
    return byStudent && bySubject;
  });

  const sentTasks     = visibleHw.filter(h => h.status === 'sent');
  const reviewTasks   = visibleHw.filter(h => h.status === 'review');
  const checkedTasks  = visibleHw.filter(h => h.status === 'checked');
  const showStudentName = selectedStudents.size !== 1;

  const [reviewingHw,   setReviewingHw]   = useState(null); 
  const [reviewData,    setReviewData]    = useState(null); 
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError,   setReviewError]   = useState(null);
  const [finishing,     setFinishing]     = useState(false);
  const [reviewMode,    setReviewMode]    = useState('review'); // review | preview | readonly

  const handleCheck = (hw) => {
    setReviewMode('review');
    setReviewingHw(hw);
    setReviewData(null);
    setReviewError(null);
    setReviewLoading(true);

    setTimeout(() => {
      setReviewData({
        tasks: [
          {
            id: 1,
            text: "Решите логарифмическое уравнение: log2(x + 3) = 4",
            subtype_name: "Логарифмические уравнения",
            diff: 1,
            autoCheck: hw.autoCheck,
            isCorrect: hw.autoCheck ? true : null,
            studentAnswer: "x = 13",
          },
          {
            id: 2,
            text: "Найдите область определения функции...",
            subtype_name: "Область определения",
            diff: 2,
            autoCheck: hw.autoCheck,
            isCorrect: hw.autoCheck ? false : null,
            studentAnswer: "(-inf; 5)",
          }
        ]
      });
      setReviewLoading(false);
    }, 400);
  };

  // Просмотр условий ДЗ до того, как ученик его решил (статус "Отправлено")
  const handlePreview = (hw) => {
    setReviewMode('preview');
    setReviewingHw(hw);
    setReviewData(null);
    setReviewError(null);
    setReviewLoading(true);

    setTimeout(() => {
      setReviewData({
        tasks: [
          {
            id: 1,
            text: "Решите логарифмическое уравнение: log2(x + 3) = 4",
            subtype_name: "Логарифмические уравнения",
            diff: 1,
            autoCheck: hw.autoCheck,
          },
          {
            id: 2,
            text: "Найдите область определения функции...",
            subtype_name: "Область определения",
            diff: 2,
            autoCheck: hw.autoCheck,
          }
        ]
      });
      setReviewLoading(false);
    }, 400);
  };

  // Просмотр уже проверенного ДЗ — финальный результат, без возможности редактировать
  const handleView = (hw) => {
    setReviewMode('readonly');
    setReviewingHw(hw);
    setReviewData(null);
    setReviewError(null);
    setReviewLoading(true);

    setTimeout(() => {
      setReviewData({
        tasks: [
          {
            id: 1,
            text: "Решите логарифмическое уравнение: log2(x + 3) = 4",
            subtype_name: "Логарифмические уравнения",
            diff: 1,
            autoCheck: hw.autoCheck,
            isCorrect: hw.autoCheck ? true : null,
            studentAnswer: "x = 13",
          },
          {
            id: 2,
            text: "Найдите область определения функции...",
            subtype_name: "Область определения",
            diff: 2,
            autoCheck: hw.autoCheck,
            isCorrect: hw.autoCheck ? false : null,
            studentAnswer: "(-inf; 5)",
          }
        ],
        savedVerdicts: { 2: 'wrong' }, // ранее выставленный вердикт по заданиям с ручной проверкой
      });
      setReviewLoading(false);
    }, 400);
  };

  const handleCloseReview = () => {
    setReviewingHw(null);
    setReviewData(null);
    setReviewError(null);
  };

  const handleFinishReview = ({ grade, verdicts }) => {
    if (!reviewingHw) return;
    setFinishing(true);

    setTimeout(() => {
      setStudentsData(prev => prev.map(s => ({
        ...s,
        homeworks: (s.homeworks || []).map(hw =>
          hw.id === reviewingHw.id ? { ...hw, status: 'checked', grade } : hw
        ),
      })));
      setFinishing(false);
      handleCloseReview();
    }, 300);
  };

  if (error) return (
    <div className="main-container">
      <div style={{ padding: '40px', textAlign: 'center', color: '#e74c3c' }}>
        ⚠️ {error}
      </div>
    </div>
  );

  if (reviewingHw) {
    return (
      <div className="main-container">
        <HomeworkReviewScreen
          hwMeta={reviewingHw}
          data={reviewData}
          loading={reviewLoading}
          error={reviewError}
          finishing={finishing}
          mode={reviewMode}
          onBack={handleCloseReview}
          onFinish={handleFinishReview}
        />
      </div>
    );
  }

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
        <div className="stat-card sent-border">
          <span className="stat-label">Отправлено</span>
          <span className="stat-value" style={{ color: '#3b82f6' }}>
            {loadingHomeworks ? '…' : sentTasks.length}
          </span>
        </div>
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
      <div className="homework-grid homework-grid--3">
        <div className="homework-column">
          <h3 className="column-title">
            Отправлено
            <span className="column-hint">ждёт выполнения учеником</span>
          </h3>
          {loadingHomeworks
            ? <p className="hw-empty">Загрузка...</p>
            : sentTasks.length === 0
              ? <p className="hw-empty">Нет отправленных</p>
              : sentTasks.map(hw => (
                  <div key={hw.id}>
                    {showStudentName && <p className="hw-student-name">{hw.studentName}</p>}
                    <HwCard hw={hw} onPreview={handlePreview} />
                  </div>
                ))
          }
        </div>

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
                    <HwCard hw={hw} onView={handleView} />
                  </div>
                ))
          }
        </div>
      </div>
    </div>
  );
};

export default TeacherHomework;