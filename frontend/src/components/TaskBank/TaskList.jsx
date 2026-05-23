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

// Временные данные — в будущем придут с бэкенда
const MOCK_TASKS = [
  { id: 1, text: 'Автомобиль проехал из города А в город Б за 3 часа со скоростью 80 км/ч. Найдите расстояние.', diff: 1, pop: 412, year: 2022 },
  { id: 2, text: 'Поезд отправился в 14:30 и прибыл в 19:15. Найдите время в пути в минутах.', diff: 1, pop: 389, year: 2023 },
  { id: 3, text: 'Турист прошёл первую часть пути за 2 ч, вторую — за 3 ч, скорость на второй части вдвое меньше. Найдите общее расстояние если скорость на первом участке 6 км/ч.', diff: 2, pop: 254, year: 2021 },
  { id: 4, text: 'Два велосипедиста выехали навстречу друг другу. Расстояние 60 км, скорости 15 и 20 км/ч. Через сколько минут они встретятся?', diff: 2, pop: 198, year: 2023 },
  { id: 5, text: 'Самолёт летит из Москвы в Сочи 2 ч 20 мин. На обратном пути — на 15 мин дольше из-за встречного ветра. Найдите суммарное время полётов.', diff: 1, pop: 321, year: 2024 },
  { id: 6, text: 'Лодка плывёт по течению 4 ч, против — 6 ч. Скорость течения 2 км/ч. Найдите скорость лодки в стоячей воде.', diff: 3, pop: 134, year: 2022 },
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

// ─── Карточка одного задания ──────────────────────────────────────────────────
const TaskCard = ({ task, index }) => (
  <div className="tl-card">
    <div className="tl-card__idx">{index + 1}</div>
    <div className="tl-card__body">
      <p className="tl-card__text">{task.text}</p>
      <div className="tl-card__meta">
        <span className={`tl-tag ${DIFF_CLASS[task.diff]}`}>{DIFF_LABEL[task.diff]}</span>
        <span className="tl-tag tl-tag--neutral">♥ {task.pop}</span>
        <span className="tl-tag tl-tag--neutral">{task.year}</span>
      </div>
    </div>
    <button className="tl-card__btn">Открыть</button>
  </div>
);

// ─── Главный компонент ────────────────────────────────────────────────────────
const TaskList = ({ examType, subject, groupName, subtypeName, onBack }) => {
  const [sort, setSort] = useState('default');

  // В будущем: fetch(`/api/tasks/?exam=${examType}&subject=${subject}&subtype=${subtypeName}`)
  const tasks = getSorted(MOCK_TASKS, sort);

  const counts = {
    easy:   MOCK_TASKS.filter(t => t.diff === 1).length,
    medium: MOCK_TASKS.filter(t => t.diff === 2).length,
    hard:   MOCK_TASKS.filter(t => t.diff === 3).length,
  };

  return (
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
        <SortDropdown sort={sort} onChange={setSort} />
      </div>

      {/* Статистика */}
      <div className="tl-stats">
        <span className="tl-stat">Всего: {tasks.length}</span>
        <span className="tl-stat tl-stat--easy">Лёгких: {counts.easy}</span>
        <span className="tl-stat tl-stat--medium">Средних: {counts.medium}</span>
        <span className="tl-stat tl-stat--hard">Сложных: {counts.hard}</span>
      </div>

      {/* Список */}
      {tasks.length === 0 ? (
        <div className="tl-empty">
          <p className="tl-empty__text">Заданий пока нет</p>
        </div>
      ) : (
        <div className="tl-list">
          {tasks.map((task, i) => (
            <TaskCard key={task.id} task={task} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;