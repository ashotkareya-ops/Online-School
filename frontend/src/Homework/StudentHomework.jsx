import React, { useState, useRef } from 'react';
import './StudentHomework.css';
import '../components/Trainer/Trainer.css';

const SUBJECT_COLORS = {
  'Математика':       { bg: '#E6F1FB', color: '#0C447C' },
  'Программирование': { bg: '#EAF3DE', color: '#27500A' },
  'Информатика':      { bg: '#EEEDFE', color: '#3C3489' },
  'Биология':         { bg: '#E1F5EE', color: '#085041' },
  'Физика':           { bg: '#FAEEDA', color: '#633806' },
  'Химия':            { bg: '#FAECE7', color: '#712B13' },
  'История':          { bg: '#FBEAF0', color: '#72243E' },
};

// ── Одна карточка задания в списке (кликабельная) ────────────────────────────
const HwCard = ({ hw, onOpen }) => {
  const col = SUBJECT_COLORS[hw.subject] || { bg: '#F1EFE8', color: '#444441' };
  return (
    <div className="hw-item-card" onClick={() => onOpen(hw)} style={{ cursor: 'pointer' }}>
      <div className="hw-item-top">
        <p className="hw-item-title">{hw.title}</p>
        {hw.autoCheck && <span className="hw-auto-badge">Авто</span>}
      </div>
      <div className="hw-item-meta">
        <span className="hw-subject-badge" style={{ background: col.bg, color: col.color }}>
          {hw.subject}
        </span>
        {hw.deadline && <span className="hw-deadline">до {hw.deadline}</span>}
      </div>
      {hw.status === 'checked' && hw.grade && (
        <div className="hw-grade-row">
          <span className="hw-grade-label">Оценка:</span>
          <span className="hw-grade-value">{hw.grade}</span>
        </div>
      )}
    </div>
  );
};

// ── Карточка задания в режиме решения (статус "todo") ────────────────────────
const SolveTaskCard = ({ task, index, userAnswer, onChange, cardRef }) => (
  <div className="tr-solve-card" ref={cardRef}>
    <div className="tr-solve-card__num">{index + 1}</div>
    <div className="tr-solve-card__body">
      <div className="tr-solve-card__meta">
        {task.subtype_name && <span className="tr-solve-tag">{task.subtype_name}</span>}
      </div>
      {task.text && <p className="tr-solve-card__text">{task.text}</p>}
      {task.taskImage && <img src={task.taskImage} alt="Условие" className="tr-solve-card__img" />}

      {task.steps?.length > 0 && (
        <div className="tr-solve-card__steps">
          {task.steps.map((step, si) => (
            <div key={si} className="tr-solve-step">
              {step.text && <p className="tr-solve-step__text">{step.text}</p>}
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

// ── Экран решения ДЗ (статус "todo") ──────────────────────────────────────────
const SolveHomeworkScreen = ({ hwMeta, tasks, loading, submitting, onBack, onSubmit }) => {
  const [answers, setAnswers] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cardRefs = useRef({});

  const answeredCount = Object.values(answers).filter(a => a.trim()).length;
  const pct = tasks.length > 0 ? (answeredCount / tasks.length) * 100 : 0;

  const handleFinish = () => {
    if (answeredCount < tasks.length) setConfirmOpen(true);
    else onSubmit(answers);
  };

  return (
    <div className="tr-screen">
      <div className="tr-solve-sticky">
        <div className="tr-solve-sticky-row">
          <div className="tr-solve-sticky-left">
            <button className="tr-back-btn" style={{ margin: 0 }} onClick={onBack}>← Назад</button>
            <div className="tr-solve-sticky-info">
              <span className="tr-solve-sticky-title">{hwMeta?.title}</span>
              <span className="tr-solve-sticky-sub">
                {answeredCount} / {tasks.length} отвечено
              </span>
            </div>
          </div>

          <div className="tr-dots">
            {tasks.map((task, i) => (
              <div
                key={task.id}
                className={`tr-dot ${answers[task.id]?.trim() ? 'answered' : ''}`}
                onClick={() => cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                title={`Задание ${i + 1}`}
              />
            ))}
          </div>

          <button className="tr-generate-btn" onClick={handleFinish} disabled={submitting} style={{ flexShrink: 0 }}>
            {submitting ? 'Отправка...' : 'Отправить →'}
          </button>
        </div>
        <div className="tr-progress-bar">
          <div className="tr-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {loading ? (
        <div className="tr-loading">Загрузка заданий...</div>
      ) : (
        <div className="tr-solve-list">
          {tasks.map((task, i) => (
            <SolveTaskCard
              key={task.id}
              task={task}
              index={i}
              userAnswer={answers[task.id] || ''}
              cardRef={el => { cardRefs.current[i] = el; }}
              onChange={val => setAnswers(prev => ({ ...prev, [task.id]: val }))}
            />
          ))}
        </div>
      )}

      {confirmOpen && (
        <div className="tr-modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="tr-modal" onClick={e => e.stopPropagation()}>
            <h3 className="tr-modal__title">Отправить не всё решённым?</h3>
            <p className="tr-modal__text">
              Вы ответили на {answeredCount} из {tasks.length} заданий.
              Незаполненные будут засчитаны как неверные.
            </p>
            <div className="tr-modal__footer">
              <button className="tr-modal__cancel" onClick={() => setConfirmOpen(false)}>Продолжить</button>
              <button className="tr-modal__confirm" onClick={() => { setConfirmOpen(false); onSubmit(answers); }}>
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Карточка задания в режиме просмотра отправленного (статус "review") ─────
const PreviewTaskCard = ({ task, index }) => (
  <div className="tr-solve-card">
    <div className="tr-solve-card__num">{index + 1}</div>
    <div className="tr-solve-card__body">
      <div className="tr-solve-card__meta">
        {task.subtype_name && <span className="tr-solve-tag">{task.subtype_name}</span>}
      </div>
      {task.text && <p className="tr-solve-card__text">{task.text}</p>}
      {task.taskImage && <img src={task.taskImage} alt="Условие" className="tr-solve-card__img" />}

      <div className="tr-answer-wrap">
        <label className="tr-answer-label">Ваш ответ:</label>
        <span className="hw-review-answer-value">{task.studentAnswer?.trim() || '—'}</span>
      </div>
    </div>
  </div>
);

// ── Экран просмотра отправленного ДЗ (статус "review") ───────────────────────
const PreviewHomeworkScreen = ({ hwMeta, tasks, loading, onBack }) => (
  <div className="tr-screen">
    <button className="tr-back-btn" onClick={onBack}>← Назад к списку</button>

    <div className="tr-solve-sticky">
      <div className="tr-solve-sticky-row">
        <div className="tr-solve-sticky-info">
          <span className="tr-solve-sticky-title">{hwMeta?.title}</span>
          <span className="tr-solve-sticky-sub">
            Отправлено · ждёт проверки учителем{hwMeta?.deadline ? ` · до ${hwMeta.deadline}` : ''}
          </span>
        </div>
      </div>
    </div>

    {loading ? (
      <div className="tr-loading">Загрузка...</div>
    ) : (
      <div className="tr-solve-list">
        {tasks.map((task, i) => <PreviewTaskCard key={task.id} task={task} index={i} />)}
      </div>
    )}
  </div>
);

// ── Экран результата проверенного ДЗ (статус "checked") ──────────────────────
const ResultHomeworkScreen = ({ hwMeta, tasks, loading, onBack }) => {
  const correctCount = tasks.filter(t => t.isCorrect).length;

  return (
    <div className="tr-screen">
      <button className="tr-back-btn" onClick={onBack}>← Назад к списку</button>

      <div className="tr-solve-sticky">
        <div className="tr-solve-sticky-row">
          <div className="tr-solve-sticky-info">
            <span className="tr-solve-sticky-title">{hwMeta?.title}</span>
            <span className="tr-solve-sticky-sub">
              Проверено{hwMeta?.grade ? ` · оценка ${hwMeta.grade}` : ''} · верно {correctCount} из {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {hwMeta?.teacherComment && (
        <div className="hw-teacher-comment">
          <span className="hw-teacher-comment__icon">💬</span>
          <span>{hwMeta.teacherComment}</span>
        </div>
      )}

      {loading ? (
        <div className="tr-loading">Загрузка...</div>
      ) : (
        <div className="tr-solve-list">
          {tasks.map((task, i) => (
            <div key={task.id} className={`hw-result-block ${task.isCorrect ? 'correct' : 'wrong'}`}>
              <div className="hw-result-row">
                <div className={`hw-result-icon ${task.isCorrect ? 'correct' : 'wrong'}`}>
                  {task.isCorrect ? '✓' : '✗'}
                </div>
                <div className="hw-result-details">
                  {task.text && <p style={{ fontWeight: 600 }}>{i + 1}. {task.text}</p>}
                  <p className="hw-result-your">Ваш ответ: <strong>{task.studentAnswer?.trim() || '—'}</strong></p>
                  {!task.isCorrect && task.answer && (
                    <p className="hw-result-correct">Правильный ответ: <strong>{task.answer}</strong></p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Корневой компонент ────────────────────────────────────────────────────────
const StudentHomework = ({ user, homeworkData = [] }) => {
  const userSubjects = user?.subjects ? Object.values(user.subjects).flat() : [];
  const subjects = userSubjects.length > 1 ? ['Все', ...userSubjects] : userSubjects;
  const [activeSubject, setActiveSubject] = useState(subjects[0] || 'Все');

  const filtered = activeSubject === 'Все'
    ? homeworkData
    : homeworkData.filter(h => h.subject === activeSubject);

  const todoTasks    = filtered.filter(h => h.status === 'todo');
  const reviewTasks  = filtered.filter(h => h.status === 'review');
  const checkedTasks = filtered.filter(h => h.status === 'checked');

  // screen: 'list' | 'solve' | 'preview' | 'result'
  const [screen, setScreen]   = useState('list');
  const [activeHw, setActiveHw] = useState(null);
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // TODO: заменить моки на реальный fetch деталей ДЗ с бэкенда (GET /api/homeworks/:id/)
  const openHomework = (hw) => {
    setActiveHw(hw);
    setTasks([]);
    setLoading(true);

    if (hw.status === 'todo')      setScreen('solve');
    else if (hw.status === 'review') setScreen('preview');
    else if (hw.status === 'checked') setScreen('result');

    setTimeout(() => {
      if (hw.status === 'todo') {
        setTasks([
          { id: 1, text: 'Решите уравнение: x² − 5x + 6 = 0', subtype_name: 'Квадратные уравнения' },
          { id: 2, text: 'Найдите корни уравнения: 2x² − 8 = 0', subtype_name: 'Квадратные уравнения' },
        ]);
      } else if (hw.status === 'review') {
        setTasks([
          { id: 1, text: 'Решите уравнение: x² − 5x + 6 = 0', studentAnswer: 'x = 2, x = 3' },
          { id: 2, text: 'Найдите корни уравнения: 2x² − 8 = 0', studentAnswer: 'x = ±2' },
        ]);
      } else {
        setTasks([
          { id: 1, text: 'Опишите метод GET в REST API', studentAnswer: 'получение данных', answer: 'получение данных', isCorrect: true },
          { id: 2, text: 'Опишите метод POST в REST API', studentAnswer: 'обновление данных', answer: 'создание данных', isCorrect: false },
        ]);
      }
      setLoading(false);
    }, 400);
  };

  const closeHomework = () => {
    setScreen('list');
    setActiveHw(null);
    setTasks([]);
  };

  // TODO: заменить на реальный POST ответов ученика (POST /api/homeworks/:id/submit/)
  const handleSubmit = (answers) => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      closeHomework();
    }, 400);
  };

  if (screen === 'solve') {
    return (
      <div className="main-container">
        <SolveHomeworkScreen
          hwMeta={activeHw}
          tasks={tasks}
          loading={loading}
          submitting={submitting}
          onBack={closeHomework}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }
  if (screen === 'preview') {
    return (
      <div className="main-container">
        <PreviewHomeworkScreen hwMeta={activeHw} tasks={tasks} loading={loading} onBack={closeHomework} />
      </div>
    );
  }
  if (screen === 'result') {
    return (
      <div className="main-container">
        <ResultHomeworkScreen hwMeta={activeHw} tasks={tasks} loading={loading} onBack={closeHomework} />
      </div>
    );
  }

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

      <div className="homework-grid homework-grid--3">

        <div className="homework-column">
          <h3 className="column-title">К выполнению</h3>
          {todoTasks.length === 0
            ? <p className="hw-empty">Нет заданий</p>
            : todoTasks.map(hw => <HwCard key={hw.id} hw={hw} onOpen={openHomework} />)
          }
        </div>

        <div className="homework-column">
          <h3 className="column-title">
            Отправленные
            <span className="column-hint">ждёт учителя</span>
          </h3>
          {reviewTasks.length === 0
            ? <p className="hw-empty">Нет заданий</p>
            : reviewTasks.map(hw => <HwCard key={hw.id} hw={hw} onOpen={openHomework} />)
          }
        </div>

        <div className="homework-column">
          <h3 className="column-title">
            Проверенные
            <span className="column-hint">результат получен</span>
          </h3>
          {checkedTasks.length === 0
            ? <p className="hw-empty">Нет заданий</p>
            : checkedTasks.map(hw => <HwCard key={hw.id} hw={hw} onOpen={openHomework} />)
          }
        </div>

      </div>
    </div>
  );
};

export default StudentHomework;