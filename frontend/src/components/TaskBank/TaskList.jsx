import React, { useState, useRef, useEffect } from 'react';
import './TaskList.css';

const SORT_OPTIONS = [
  { id: 'default',  label: 'По умолчанию' },
  { id: 'easy',     label: 'Сначала простые' },
  { id: 'hard',     label: 'Сначала сложные' },
  { id: 'popular',  label: 'По популярности' },
  { id: 'new',      label: 'Сначала новые' },
  { id: 'old',      label: 'Сначала старые' },
];

const DIFF_LABEL = { 1: 'Лёгкое', 2: 'Среднее', 3: 'Сложное' };
const DIFF_CLASS  = { 1: 'tl-tag--easy', 2: 'tl-tag--medium', 3: 'tl-tag--hard' };

const MOCK_TASKS = [
  {
    id: 1,
    text: 'Автомобиль проехал из города А в город Б за 3 часа со скоростью 80 км/ч. Найдите расстояние.',
    diff: 1, pop: 412, year: 2022,
    solution: [
      'Используем формулу: расстояние = скорость × время',
      'S = 80 км/ч × 3 ч = 240 км',
    ],
    answer: '240 км',
  },
  {
    id: 2,
    text: 'Поезд отправился в 14:30 и прибыл в 19:15. Найдите время в пути в минутах.',
    diff: 1, pop: 389, year: 2023,
    solution: [
      'Считаем часы: 19 − 14 = 5 часов',
      'Учитываем минуты: 15 − 30 = −15, значит 4 ч 45 мин',
      'Переводим: 4 × 60 + 45 = 285 минут',
    ],
    answer: '285 минут',
  },
  {
    id: 3,
    text: 'Турист прошёл первую часть пути за 2 ч, вторую — за 3 ч, скорость на второй части вдвое меньше. Найдите общее расстояние если скорость на первом участке 6 км/ч.',
    diff: 2, pop: 254, year: 2021,
    solution: [
      'Первый участок: S₁ = 6 × 2 = 12 км',
      'Скорость на втором: 6 ÷ 2 = 3 км/ч',
      'Второй участок: S₂ = 3 × 3 = 9 км',
      'Итого: S = 12 + 9 = 21 км',
    ],
    answer: '21 км',
  },
  {
    id: 4,
    text: 'Два велосипедиста выехали навстречу друг другу. Расстояние 60 км, скорости 15 и 20 км/ч. Через сколько минут они встретятся?',
    diff: 2, pop: 198, year: 2023,
    solution: [
      'Скорость сближения: 15 + 20 = 35 км/ч',
      'Время встречи: 60 ÷ 35 ≈ 1,714 ч',
      'В минутах: 1,714 × 60 ≈ 103 мин',
    ],
    answer: '≈ 103 минуты',
  },
  {
    id: 5,
    text: 'Самолёт летит из Москвы в Сочи 2 ч 20 мин. На обратном пути — на 15 мин дольше. Найдите суммарное время полётов.',
    diff: 1, pop: 321, year: 2024,
    solution: [
      'Туда: 2 ч 20 мин = 140 мин',
      'Обратно: 140 + 15 = 155 мин',
      'Итого: 140 + 155 = 295 мин = 4 ч 55 мин',
    ],
    answer: '295 минут (4 ч 55 мин)',
  },
  {
    id: 6,
    text: 'Лодка плывёт по течению 4 ч, против — 6 ч. Скорость течения 2 км/ч. Найдите скорость лодки в стоячей воде.',
    diff: 3, pop: 134, year: 2022,
    solution: [
      'Пусть скорость лодки = v км/ч',
      'По течению: (v+2)×4, против: (v−2)×6 — расстояния равны',
      '4v + 8 = 6v − 12 → 2v = 20 → v = 10',
    ],
    answer: '10 км/ч',
  },
];

const getSorted = (tasks, sort) => {
  const t = [...tasks];
  switch (sort) {
    case 'easy':    return t.sort((a, b) => a.diff - b.diff);
    case 'hard':    return t.sort((a, b) => b.diff - a.diff);
    case 'popular': return t.sort((a, b) => b.pop - a.pop);
    case 'new':     return t.sort((a, b) => b.year - a.year);
    case 'old':     return t.sort((a, b) => a.year - b.year);
    default:        return t;
  }
};

// ─── Дропдаун сортировки ──────────────────────────────────────────────────────
const SortDropdown = ({ sort, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = SORT_OPTIONS.find(o => o.id === sort)?.label || 'Сортировка';

  return (
    <div className="tl-sort" ref={ref}>
      <button className={`tl-sort__btn ${open ? 'open' : ''}`} onClick={() => setOpen(v => !v)}>
        {label}
        <span className="tl-sort__arrow">▼</span>
      </button>
      {open && (
        <div className="tl-sort__drop">
          {SORT_OPTIONS.map(o => (
            <div
              key={o.id}
              className={`tl-sort__item ${o.id === sort ? 'active' : ''}`}
              onClick={() => { onChange(o.id); setOpen(false); }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Панель решения (плавное раскрытие через CSS transition) ──────────────────
const SolutionPanel = ({ task, open }) => (
  <div className={`tl-solution ${open ? 'open' : ''}`}>
    <div className="tl-solution__inner">
      <div className="tl-solution__section">
        <span className="tl-solution__label">Решение</span>
        <div className="tl-solution__steps">
          {task.solution.map((step, i) => (
            <div key={i} className="tl-solution__step">
              <div className="tl-solution__step-num">{i + 1}</div>
              <p className="tl-solution__step-text">{step}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="tl-answer">
        <span className="tl-answer__label">Ответ:</span>
        <span className="tl-answer__val">{task.answer}</span>
      </div>
    </div>
  </div>
);

// ─── Карточка одного задания ──────────────────────────────────────────────────
const TaskCard = ({ task, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`tl-card ${open ? 'expanded' : ''}`}>
      <div className="tl-card__main">
        <div className="tl-card__idx">{index + 1}</div>
        <div className="tl-card__body">
          <p className="tl-card__text">{task.text}</p>
          <div className="tl-card__meta">
            <span className={`tl-tag ${DIFF_CLASS[task.diff]}`}>{DIFF_LABEL[task.diff]}</span>
            <span className="tl-tag tl-tag--neutral">♥ {task.pop}</span>
            <span className="tl-tag tl-tag--neutral">{task.year}</span>
          </div>
        </div>
        <button
          className={`tl-card__btn ${open ? 'active' : ''}`}
          onClick={() => setOpen(v => !v)}
        >
          Решение <span className="tl-card__btn-arrow">▼</span>
        </button>
      </div>
      <SolutionPanel task={task} open={open} />
    </div>
  );
};

// ─── Модалка добавления задания ───────────────────────────────────────────────
const AddTaskModal = ({ onClose, onSave, subtypeName }) => {
  const [form, setForm] = useState({
    text: '', solution: '', answer: '', diff: '1', year: '2024',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!form.text.trim()) { setError('Введите текст задания'); return; }
    if (!form.answer.trim()) { setError('Введите ответ'); return; }
    setError('');
    setLoading(true);
    // В будущем: await fetch('/api/tasks/', { method: 'POST', body: JSON.stringify(form) })
    await new Promise(r => setTimeout(r, 600)); // имитация запроса
    setLoading(false);
    onSave(form);
  };

  return (
    <div className="tl-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tl-modal">
        <div className="tl-modal__header">
          <h3 className="tl-modal__title">Добавить задание</h3>
          <button className="tl-modal__close" onClick={onClose}>✕</button>
        </div>

        {subtypeName && (
          <div className="tl-modal__crumb">
            Тип: <strong>{subtypeName}</strong>
          </div>
        )}

        <div className="tl-modal__fields">
          <div className="tl-modal__field">
            <label className="tl-modal__label">Текст задания *</label>
            <textarea
              className="tl-modal__textarea"
              rows={3}
              placeholder="Введите условие задачи..."
              value={form.text}
              onChange={e => set('text', e.target.value)}
            />
          </div>

          <div className="tl-modal__field">
            <label className="tl-modal__label">Решение (по шагам)</label>
            <textarea
              className="tl-modal__textarea"
              rows={4}
              placeholder={'Шаг 1: ...\nШаг 2: ...\nШаг 3: ...'}
              value={form.solution}
              onChange={e => set('solution', e.target.value)}
            />
            <span className="tl-modal__hint">Каждый шаг с новой строки</span>
          </div>

          <div className="tl-modal__field">
            <label className="tl-modal__label">Ответ *</label>
            <textarea
              className="tl-modal__textarea tl-modal__textarea--sm"
              rows={1}
              placeholder="Например: 240 км"
              value={form.answer}
              onChange={e => set('answer', e.target.value)}
            />
          </div>

          <div className="tl-modal__row">
            <div className="tl-modal__field">
              <label className="tl-modal__label">Сложность</label>
              <select
                className="tl-modal__select"
                value={form.diff}
                onChange={e => set('diff', e.target.value)}
              >
                <option value="1">Лёгкое</option>
                <option value="2">Среднее</option>
                <option value="3">Сложное</option>
              </select>
            </div>
            <div className="tl-modal__field">
              <label className="tl-modal__label">Год</label>
              <select
                className="tl-modal__select"
                value={form.year}
                onChange={e => set('year', e.target.value)}
              >
                {[2024, 2023, 2022, 2021, 2020].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="tl-modal__error">{error}</p>}

        <div className="tl-modal__footer">
          <button className="tl-modal__cancel" onClick={onClose}>Отмена</button>
          <button
            className="tl-modal__save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Сохранение...' : 'Добавить задание'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Главный компонент ────────────────────────────────────────────────────────
const TaskList = ({ examType, subject, groupName, subtypeName, onBack }) => {
  const [sort, setSort]           = useState('default');
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks]         = useState(MOCK_TASKS);

  const sorted = getSorted(tasks, sort);

  const counts = {
    easy:   tasks.filter(t => t.diff === 1).length,
    medium: tasks.filter(t => t.diff === 2).length,
    hard:   tasks.filter(t => t.diff === 3).length,
  };

  const handleSave = (form) => {
    const newTask = {
      id: Date.now(),
      text: form.text.trim(),
      solution: form.solution.trim().split('\n').filter(Boolean),
      answer: form.answer.trim(),
      diff: Number(form.diff),
      pop: 0,
      year: Number(form.year),
    };
    setTasks(prev => [newTask, ...prev]);
    setShowModal(false);
  };

  return (
    <>
      <div className="tl-wrap">
        <button className="tl-back-btn" onClick={onBack}>← Назад</button>

        {/* Шапка */}
        <div className="tl-header">
          <div className="tl-header__left">
            <h2 className="tl-title">{subtypeName}</h2>
            <div className="tl-crumbs">
              <span className="tl-crumb">{examType === 'oge' ? 'ОГЭ' : 'ЕГЭ'}</span>
              <span className="tl-crumb-sep">·</span>
              <span className="tl-crumb">{subject}</span>
              <span className="tl-crumb-sep">·</span>
              <span className="tl-crumb">{groupName}</span>
              <span className="tl-crumb-sep">·</span>
              <span className="tl-crumb tl-crumb--active">{subtypeName}</span>
            </div>
          </div>
          <div className="tl-header__actions">
            <SortDropdown sort={sort} onChange={setSort} />
            <button className="tl-add-btn" onClick={() => setShowModal(true)}>
              + Добавить задание
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="tl-stats">
          <span className="tl-stat">Всего: {tasks.length}</span>
          <span className="tl-stat tl-stat--easy">Лёгких: {counts.easy}</span>
          <span className="tl-stat tl-stat--medium">Средних: {counts.medium}</span>
          <span className="tl-stat tl-stat--hard">Сложных: {counts.hard}</span>
        </div>

        {/* Список */}
        {sorted.length === 0 ? (
          <div className="tl-empty">
            <p className="tl-empty__icon">📋</p>
            <p className="tl-empty__text">Заданий пока нет</p>
            <p className="tl-empty__hint">Нажмите «Добавить задание», чтобы создать первое</p>
          </div>
        ) : (
          <div className="tl-list">
            {sorted.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddTaskModal
          subtypeName={subtypeName}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default TaskList;