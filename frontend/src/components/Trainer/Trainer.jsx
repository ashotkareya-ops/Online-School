import React, { useState, useEffect, useRef } from 'react';
import './Trainer.css';

const API_URL = import.meta.env.VITE_API_URL;

const authFetch = (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });
};

// ─── Утилиты ──────────────────────────────────────────────────────────────────
const pluralTasks = (n) => {
  if (n % 10 === 1 && n % 100 !== 11) return 'задание';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'задания';
  return 'заданий';
};

// ─── Компонент: строка подтипа в конструкторе ─────────────────────────────────
const SubtypeSelector = ({ subtype, checked, count, onToggle, onCount }) => (
  <div className={`tr-subtype-row ${checked ? 'active' : ''}`}>
    <button
      className={`tr-checkbox ${checked ? 'checked' : ''}`}
      onClick={onToggle}
      aria-label={`Выбрать ${subtype.name}`}
    />
    <span className="tr-subtype-name" onClick={onToggle}>
      {subtype.name}
    </span>
    <span className="tr-subtype-avail">{subtype.total} шт.</span>
    <div className={`tr-counter ${!checked ? 'disabled' : ''}`}>
      <button
        className="tr-counter-btn"
        onClick={() => onCount(-1)}
        disabled={!checked || count <= 1}
      >−</button>
      <span className="tr-counter-val">{count}</span>
      <button
        className="tr-counter-btn"
        onClick={() => onCount(1)}
        disabled={!checked || count >= subtype.total}
      >+</button>
    </div>
  </div>
);

// ─── Компонент: группа (аккордеон) в конструкторе ────────────────────────────
const CategoryAccordion = ({
  category, index, isOpen, onToggle,
  checked, counts, onSubtypeToggle, onCount,
}) => {
  const selectedCount = category.subtypes.filter(s => checked[s.id]).length;
  return (
    <div className={`tr-category ${isOpen ? 'open' : ''}`}>
      <button className="tr-category-header" onClick={onToggle}>
        <span className="tr-category-num">{index + 1}</span>
        <span className="tr-category-name">{category.name}</span>
        {selectedCount > 0 && (
          <span className="tr-category-badge">{selectedCount} выбрано</span>
        )}
        <span className={`tr-chevron ${isOpen ? 'open' : ''}`}>▾</span>
      </button>
      {isOpen && (
        <div className="tr-category-body">
          {category.subtypes.map(sub => (
            <SubtypeSelector
              key={sub.id}
              subtype={sub}
              checked={!!checked[sub.id]}
              count={counts[sub.id] || Math.min(5, sub.total) || 0}
              onToggle={() => onSubtypeToggle(sub.id, sub.total)}
              onCount={(delta) => onCount(sub.id, delta, sub.total)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Экран 1: Конструктор варианта ────────────────────────────────────────────
const ConstructorScreen = ({ subjectId, subjectName, onGenerate, onBack }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [openCat, setOpenCat]       = useState(null);
  const [checked, setChecked]       = useState({});
  const [counts, setCounts]         = useState({});
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await authFetch(`${API_URL}/api/tasks/groups/?subject_id=${subjectId}`);
        if (res.ok) setCategories(await res.json());
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetch_();
  }, [subjectId]);

  const handleToggle = (sid, total) => {
    if (total === 0) return;
    setChecked(prev => {
      const next = { ...prev, [sid]: !prev[sid] };
      if (next[sid] && !counts[sid])
        setCounts(c => ({ ...c, [sid]: Math.min(5, total) }));
      return next;
    });
  };

  const handleCount = (sid, delta, total) => {
    setCounts(prev => ({
      ...prev,
      [sid]: Math.max(1, Math.min(total, (prev[sid] || 1) + delta)),
    }));
  };

  const selected = Object.entries(checked).filter(([, v]) => v);
  const totalRequested = selected.reduce((sum, [k]) => sum + (counts[k] || 0), 0);

  const handleGenerate = async () => {
    if (!selected.length) { setError('Выберите хотя бы один подтип'); return; }
    setError('');
    setGenerating(true);
    const limits = selected.map(([sid]) => ({
      subtype_id: Number(sid),
      count: counts[sid] || 1,
    }));
    try {
      const res = await authFetch(`${API_URL}/api/tasks/generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId, limits }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Ошибка генерации');
        return;
      }
      const data = await res.json();
      onGenerate(data.tasks);
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="tr-screen">
      <button className="tr-back-btn" onClick={onBack}>← Назад</button>

      <div className="tr-header">
        <h2 className="tr-title">Конструктор тренажёра</h2>
        <p className="tr-subtitle">
          {subjectName} · Выберите темы и укажите количество заданий
        </p>
      </div>

      {loading ? (
        <div className="tr-loading">Загрузка тем...</div>
      ) : categories.length === 0 ? (
        <div className="tr-empty">
          <span className="tr-empty-icon">📋</span>
          <p>Темы не найдены. Попросите преподавателя добавить задания в банк.</p>
        </div>
      ) : (
        <div className="tr-categories">
          {categories.map((cat, i) => (
            <CategoryAccordion
              key={cat.id}
              category={cat}
              index={i}
              isOpen={openCat === cat.id}
              onToggle={() => setOpenCat(prev => prev === cat.id ? null : cat.id)}
              checked={checked}
              counts={counts}
              onSubtypeToggle={handleToggle}
              onCount={handleCount}
            />
          ))}
        </div>
      )}

      {error && <p className="tr-error">{error}</p>}

      <div className="tr-footer">
        {totalRequested > 0 && (
          <span className="tr-summary">
            {totalRequested} {pluralTasks(totalRequested)} из {selected.length}{' '}
            {selected.length === 1 ? 'типа' : 'типов'}
          </span>
        )}
        <button
          className="tr-generate-btn"
          onClick={handleGenerate}
          disabled={generating || selected.length === 0}
        >
          {generating ? 'Генерация...' : 'Создать тренажёр →'}
        </button>
      </div>
    </div>
  );
};

// ─── Компонент: карточка задания в режиме решения ─────────────────────────────
const SolveCard = ({ task, index, userAnswer, onChange, cardRef }) => (
  <div className="tr-solve-card" ref={cardRef}>
    <div className="tr-solve-card__num">{index + 1}</div>
    <div className="tr-solve-card__body">
      <div className="tr-solve-card__meta">
        <span className="tr-solve-tag">{task.subtype_name}</span>
        <span className="tr-solve-tag tr-solve-tag--diff">
          {task.diff === 1 ? 'Лёгкое' : task.diff === 2 ? 'Среднее' : 'Сложное'}
        </span>
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

      <div className="tr-answer-wrap">
        <label className="tr-answer-label">Ответ:</label>
        <input
          type="text"
          className={`tr-answer-input ${userAnswer.trim() ? 'filled' : ''}`}
          placeholder="Введите ответ..."
          value={userAnswer}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  </div>
);

// ─── Экран 2: Решение ─────────────────────────────────────────────────────────
const SolveScreen = ({ tasks, onFinish, onBack }) => {
  const [answers, setAnswers] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cardRefs = useRef({});

  const answeredCount = Object.values(answers).filter(a => a.trim()).length;
  const pct = tasks.length > 0 ? (answeredCount / tasks.length) * 100 : 0;

  const handleFinish = () => {
    if (answeredCount < tasks.length) {
      setConfirmOpen(true);
    } else {
      onFinish(answers);
    }
  };

  const scrollToCard = (index) => {
    cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="tr-screen">

      {/* ── Липкая шапка с прогрессом ── */}
      <div className="tr-solve-sticky">
        <div className="tr-solve-sticky-row">
          <div className="tr-solve-sticky-left">
            <button className="tr-back-btn" style={{ margin: 0 }} onClick={onBack}>← Назад</button>
            <div className="tr-solve-sticky-info">
              <span className="tr-solve-sticky-title">
                {answeredCount} / {tasks.length} отвечено
              </span>
              <span className="tr-solve-sticky-sub">
                {tasks.length - answeredCount === 0
                  ? 'Все задания заполнены ✓'
                  : `Осталось: ${tasks.length - answeredCount}`}
              </span>
            </div>
          </div>

          {/* Dots-навигация */}
          <div className="tr-dots">
            {tasks.map((task, i) => (
              <div
                key={task.id}
                className={`tr-dot ${answers[task.id]?.trim() ? 'answered' : ''}`}
                onClick={() => scrollToCard(i)}
                title={`Задание ${i + 1}`}
              />
            ))}
          </div>

          <button className="tr-generate-btn" onClick={handleFinish} style={{ flexShrink: 0 }}>
            Завершить →
          </button>
        </div>

        {/* Тонкая полоса прогресса */}
        <div className="tr-progress-bar">
          <div className="tr-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* ── Список карточек ── */}
      <div className="tr-solve-list">
        {tasks.map((task, i) => (
          <SolveCard
            key={task.id}
            task={task}
            index={i}
            userAnswer={answers[task.id] || ''}
            cardRef={el => { cardRefs.current[i] = el; }}
            onChange={val => setAnswers(prev => ({ ...prev, [task.id]: val }))}
          />
        ))}
      </div>

      {confirmOpen && (
        <div className="tr-modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="tr-modal" onClick={e => e.stopPropagation()}>
            <h3 className="tr-modal__title">Завершить досрочно?</h3>
            <p className="tr-modal__text">
              Вы ответили на {answeredCount} из {tasks.length} заданий.
              Незаполненные будут засчитаны как неверные.
            </p>
            <div className="tr-modal__footer">
              <button className="tr-modal__cancel" onClick={() => setConfirmOpen(false)}>
                Продолжить
              </button>
              <button className="tr-modal__confirm" onClick={() => { setConfirmOpen(false); onFinish(answers); }}>
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Экран 3: Результаты ──────────────────────────────────────────────────────
const ResultCard = ({ task, index, userAnswer, isCorrect, showAnswer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`tr-result-card ${isCorrect ? 'correct' : 'wrong'}`}>
      <div className="tr-result-card__header" onClick={() => setOpen(v => !v)}>
        <div className={`tr-result-icon ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect ? '✓' : '✗'}
        </div>
        <div className="tr-result-card__info">
          <span className="tr-result-card__num">Задание {index + 1}</span>
          <span className="tr-result-card__type">{task.subtype_name}</span>
        </div>
        <div className="tr-result-answers">
          <span className={`tr-result-user ${isCorrect ? 'correct' : 'wrong'}`}>
            {userAnswer.trim() || '—'}
          </span>
          {!isCorrect && showAnswer && (
            <span className="tr-result-correct">→ {task.answer}</span>
          )}
        </div>
        <span className={`tr-chevron ${open ? 'open' : ''}`}>▾</span>
      </div>

      {open && (
        <div className="tr-result-card__body">
          {task.text && <p className="tr-result-task-text">{task.text}</p>}
          {task.taskImage && <img src={task.taskImage} alt="" className="tr-solve-card__img" />}
        </div>
      )}
    </div>
  );
};

const ResultScreen = ({ tasks, answers, onRetry, onNew }) => {
  const [showAnswers, setShowAnswers] = useState(true);

  const results = tasks.map(task => {
    const userAns = (answers[task.id] || '').trim().toLowerCase();
    const correct  = task.answer.trim().toLowerCase();
    return { task, userAnswer: answers[task.id] || '', isCorrect: userAns === correct };
  });

  const correctCount = results.filter(r => r.isCorrect).length;
  const pct = Math.round((correctCount / tasks.length) * 100);

  const grade = pct >= 90 ? { label: 'Отлично!', cls: 'excellent' }
    : pct >= 70 ? { label: 'Хорошо', cls: 'good' }
    : pct >= 50 ? { label: 'Нормально', cls: 'ok' }
    : { label: 'Нужно повторить', cls: 'poor' };

  // Круговой индикатор
  const R = 46;
  const circumference = 2 * Math.PI * R;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="tr-screen">
      <div className="tr-result-summary">
        {/* Круговой SVG-индикатор */}
        <div className="tr-result-circle-wrap">
          <svg className="tr-result-circle-svg" viewBox="0 0 120 120">
            <circle className="tr-result-circle-bg" cx="60" cy="60" r={R} />
            <circle
              className={`tr-result-circle-fg ${grade.cls}`}
              cx="60" cy="60" r={R}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="tr-result-circle-label">
            <span className={`tr-result-circle-pct ${grade.cls}`}>{pct}%</span>
            <span className="tr-result-circle-grade">{grade.label}</span>
          </div>
        </div>

        <div className="tr-result-stats">
          <div className="tr-result-stat correct">
            <span className="tr-result-stat__val">{correctCount}</span>
            <span className="tr-result-stat__label">Верно</span>
          </div>
          <div className="tr-result-stat wrong">
            <span className="tr-result-stat__val">{tasks.length - correctCount}</span>
            <span className="tr-result-stat__label">Ошибок</span>
          </div>
          <div className="tr-result-stat total">
            <span className="tr-result-stat__val">{tasks.length}</span>
            <span className="tr-result-stat__label">Всего</span>
          </div>
        </div>

        <label className="tr-show-answers-toggle">
          <input
            type="checkbox"
            checked={showAnswers}
            onChange={e => setShowAnswers(e.target.checked)}
          />
          <span>Показывать правильные ответы</span>
        </label>
      </div>

      <div className="tr-result-list">
        {results.map((r, i) => (
          <ResultCard
            key={r.task.id}
            task={r.task}
            index={i}
            userAnswer={r.userAnswer}
            isCorrect={r.isCorrect}
            showAnswer={showAnswers}
          />
        ))}
      </div>

      <div className="tr-footer tr-footer--results">
        <button className="tr-outline-btn" onClick={onRetry}>
          ↺ Повторить с теми же заданиями
        </button>
        <button className="tr-generate-btn" onClick={onNew}>
          Новый тренажёр →
        </button>
      </div>
    </div>
  );
};

// ─── Выбор предмета ──────────────────────────────────────────────────────────
const SubjectPicker = ({ examType, subjects, loading, onSelect }) => (
  <div className="tr-screen">
    <h2 className="tr-title">Тренажёр</h2>
    <p className="tr-subtitle">Выберите предмет для тренировки</p>
    {loading ? (
      <div className="tr-loading">Загрузка предметов...</div>
    ) : subjects.length === 0 ? (
      <div className="tr-empty">
        <span className="tr-empty-icon">📚</span>
        <p>Предметы не найдены</p>
      </div>
    ) : (
      <div className="tr-subjects-grid">
        {subjects.map(s => (
          <button key={s.id} className="tr-subject-btn" onClick={() => onSelect(s)}>
            {s.name}
            <span className="tr-subject-btn__arrow">→</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

// ─── Корневой компонент Trainer ───────────────────────────────────────────────
const Trainer = ({ user }) => {
  const [screen, setScreen]           = useState('subject'); // subject | constructor | solve | result
  const [subjects, setSubjects]       = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [generatedTasks, setGeneratedTasks]   = useState([]);
  const [userAnswers, setUserAnswers]         = useState({});

  const examType = user?.exam_type?.[0] || 'oge';

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await authFetch(`${API_URL}/api/tasks/subjects/?exam_type=${examType}`);
        if (res.ok) setSubjects(await res.json());
      } catch { /* silent */ } finally { setLoadingSubjects(false); }
    };
    fetch_();
  }, [examType]);

  const handleGenerate = (tasks) => {
    setGeneratedTasks(tasks);
    setUserAnswers({});
    setScreen('solve');
  };

  const handleFinish = (answers) => {
    setUserAnswers(answers);
    setScreen('result');
  };

  const handleRetry = () => {
    setUserAnswers({});
    setScreen('solve');
  };

  const handleNew = () => {
    setGeneratedTasks([]);
    setUserAnswers({});
    setScreen('constructor');
  };

  return (
    <div className="tr-wrap">
      {screen === 'subject' && (
        <SubjectPicker
          examType={examType}
          subjects={subjects}
          loading={loadingSubjects}
          onSelect={s => { setSelectedSubject(s); setScreen('constructor'); }}
        />
      )}
      {screen === 'constructor' && selectedSubject && (
        <ConstructorScreen
          subjectId={selectedSubject.id}
          subjectName={selectedSubject.name}
          onGenerate={handleGenerate}
          onBack={() => setScreen('subject')}
        />
      )}
      {screen === 'solve' && (
        <SolveScreen
          tasks={generatedTasks}
          onFinish={handleFinish}
          onBack={() => setScreen('constructor')}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          tasks={generatedTasks}
          answers={userAnswers}
          onRetry={handleRetry}
          onNew={handleNew}
        />
      )}
    </div>
  );
};

export default Trainer;