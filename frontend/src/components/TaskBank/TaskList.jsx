import React, { useState, useRef, useEffect, useCallback } from 'react';
import './TaskList.css';

// ─── Константы ────────────────────────────────────────────────────────────────
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 МБ

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
    id: 1, text: 'Автомобиль проехал из города А в город Б за 3 часа со скоростью 80 км/ч. Найдите расстояние.',
    taskImage: null,
    diff: 1, pop: 412, year: 2022,
    steps: [
      { text: 'Используем формулу: расстояние = скорость × время', image: null },
      { text: 'S = 80 км/ч × 3 ч = 240 км', image: null }
    ],
    answer: '240 км',
  },
  {
    id: 2, text: 'Поезд отправился в 14:30 и прибыл в 19:15. Найдите время в пути в минутах.',
    taskImage: null,
    diff: 1, pop: 389, year: 2023,
    steps: [
      { text: 'Считаем часы: 19 − 14 = 5 часов', image: null },
      { text: 'Учитываем минуты: 15 − 30 = −15, значит 4 ч 45 мин', image: null },
      { text: 'Переводим: 4 × 60 + 45 = 285 минут', image: null }
    ],
    answer: '285 минут',
  },
  {
    id: 3, text: 'Два велосипедиста выехали навстречу. Расстояние 60 км, скорости 15 и 20 км/ч. Через сколько минут встретятся?',
    taskImage: null,
    diff: 2, pop: 198, year: 2023,
    steps: [
      { text: 'Скорость сближения: 15 + 20 = 35 км/ч', image: null },
      { text: 'Время: 60 ÷ 35 ≈ 1,714 ч', image: null },
      { text: 'В минутах: ≈ 103 мин', image: null }
    ],
    answer: '≈ 103 минуты',
  },
];

// ─── Утилиты ──────────────────────────────────────────────────────────────────

// Конвертируем файл в base64 строку
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result); // data:image/...;base64,...
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const label = SORT_OPTIONS.find(o => o.id === sort)?.label || 'Сортировка';
  return (
    <div className="tl-sort" ref={ref}>
      <button className={`tl-sort__btn ${open ? 'open' : ''}`} onClick={() => setOpen(v => !v)}>
        {label} <span className="tl-sort__arrow">▼</span>
      </button>
      {open && (
        <div className="tl-sort__drop">
          {SORT_OPTIONS.map(o => (
            <div key={o.id} className={`tl-sort__item ${o.id === sort ? 'active' : ''}`}
              onClick={() => { onChange(o.id); setOpen(false); }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Зона загрузки картинки ───────────────────────────────────────────────────
const ImageUploadZone = ({ label, value, onChange, onError }) => {
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { onError('Файл должен быть изображением'); return; }
    if (file.size > MAX_IMAGE_BYTES) { onError('Файл слишком большой (макс. 2 МБ)'); return; }
    try {
      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch {
      onError('Не удалось загрузить изображение');
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const handleDragOver = (e) => e.preventDefault();

  if (value) {
    return (
      <div className="tl-img-preview">
        <img src={value} alt="Прикреплённое изображение" />
        <div className="tl-img-preview__footer">
          <span className="tl-img-preview__name">📎 Изображение прикреплено</span>
          <button type="button" className="tl-img-preview__remove" onClick={() => onChange(null)}>
            Удалить ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="tl-img-zone"
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <span className="tl-img-zone__icon">🖼️</span>
      <span className="tl-img-zone__text">{label}</span>
      <span className="tl-img-zone__hint">JPG, PNG, GIF · до 2 МБ</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
};

// ─── Поле года с кнопкой «Авто» ──────────────────────────────────────────────
const YearField = ({ value, onChange }) => {
  const [isAuto, setIsAuto] = useState(true);
  const currentYear = new Date().getFullYear();

  const toggleAuto = () => {
    if (!isAuto) {
      onChange(currentYear);
    }
    setIsAuto(v => !v);
  };

  return (
    <div className="tl-year-wrap">
      <input
        type="number"
        className="tl-year-input"
        value={value}
        min={2000}
        max={currentYear + 1}
        readOnly={isAuto}
        onChange={(e) => !isAuto && onChange(Number(e.target.value))}
      />
      <button
        type="button"
        className={`tl-year-auto ${isAuto ? 'active' : ''}`}
        onClick={toggleAuto}
        title={isAuto ? 'Кликните чтобы ввести год вручную' : 'Кликните чтобы поставить текущий год'}
      >
        {isAuto ? '✓ Авто' : 'Авто'}
      </button>
    </div>
  );
};

// ─── Панель решения ───────────────────────────────────────────────────────────
const SolutionPanel = ({ task, open }) => (
  <div className={`tl-solution ${open ? 'open' : ''}`}>
    <div className="tl-solution__inner">
      <div className="tl-solution__section">
        <span className="tl-solution__label">Решение</span>
        <div className="tl-solution__steps">
          {task.steps.map((step, i) => (
            <div key={i} className="tl-solution__step">
              <div className="tl-solution__step-num">{i + 1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {step.text && <p className="tl-solution__step-text">{step.text}</p>}
                {step.image && (
                  <img src={step.image} alt={`К шагу ${i + 1}`} className="tl-solution__step-img" />
                )}
              </div>
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

// ─── Карточка задания ─────────────────────────────────────────────────────────
const TaskCard = ({ task, index, cart, onCartToggle }) => {
  const [open, setOpen] = useState(false);
  const inCart = cart.some(t => t.id === task.id);

  return (
    <div className={`tl-card ${open ? 'expanded' : ''} ${inCart ? 'in-cart' : ''}`}>
      <div className="tl-card__main">
        <div className={`tl-card__idx ${inCart ? 'in-cart' : ''}`}>{index + 1}</div>
        <div className="tl-card__body">
          {task.text && <p className="tl-card__text">{task.text}</p>}
          {/* Отрисовка картинки к условию, если она есть */}
          {task.taskImage && (
             <img src={task.taskImage} alt="К условию" className="tl-card__task-img" />
          )}
          <div className="tl-card__meta">
            <span className={`tl-tag ${DIFF_CLASS[task.diff]}`}>{DIFF_LABEL[task.diff]}</span>
            <span className="tl-tag tl-tag--neutral">♥ {task.pop}</span>
            <span className="tl-tag tl-tag--neutral">{task.year}</span>
          </div>
        </div>
        <div className="tl-card-actions">
          <button
            className={`tl-add-hw-btn ${inCart ? 'added' : ''}`}
            onClick={() => onCartToggle(task)}
            title={inCart ? 'Убрать из ДЗ' : 'Добавить в ДЗ'}
          >
            {inCart ? '✓' : '+'}
          </button>
          <button
            className={`tl-card__btn ${open ? 'active' : ''}`}
            onClick={() => setOpen(v => !v)}
          >
            Решение <span className="tl-card__btn-arrow">▼</span>
          </button>
        </div>
      </div>
      <SolutionPanel task={task} open={open} />
    </div>
  );
};

// ─── Модалка добавления задания ───────────────────────────────────────────────
const AddTaskModal = ({ onClose, onSave, subtypeName }) => {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    text: '', answer: '',
    taskImage: null, // Добавлено поле для картинки условия
    diff: '1', year: currentYear,
    steps: [{ text: '', image: null }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const setField = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const updateStep = (index, field, val) => {
    const newSteps = [...form.steps];
    newSteps[index][field] = val;
    setForm({ ...form, steps: newSteps });
  };

  const addStep = () => {
    setForm({ ...form, steps: [...form.steps, { text: '', image: null }] });
  };

  const removeStep = (index) => {
    if (form.steps.length > 1) {
      const newSteps = form.steps.filter((_, i) => i !== index);
      setForm({ ...form, steps: newSteps });
    }
  };

  const handleSave = async () => {
    // Условие может быть либо текстом, либо картинкой, либо и тем, и другим.
    // Проверяем, что есть хоть что-то.
    if (!form.text.trim() && !form.taskImage) { 
      setError('Введите текст задания или прикрепите изображение к условию'); 
      return; 
    }
    if (!form.answer.trim()) { 
      setError('Введите ответ'); 
      return; 
    }
    
    // Исключаем шаги, которые вообще пустые (и без текста, и без картинки)
    const validSteps = form.steps.filter(s => s.text.trim() !== '' || s.image !== null);
    if (validSteps.length === 0) { 
      setError('Добавьте хотя бы один шаг решения (с текстом или картинкой)'); 
      return; 
    }

    setError('');
    setLoading(true);
    // Имитация отправки запроса
    await new Promise(r => setTimeout(r, 400));
    setLoading(false);
    
    onSave({
      text: form.text,
      taskImage: form.taskImage,
      answer: form.answer,
      diff: Number(form.diff),
      year: Number(form.year),
      steps: validSteps,
    });
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
          {/* Условие задания (Текст + Картинка) */}
          <div className="tl-modal__field">
            <label className="tl-modal__label">Условие задания *</label>
            <textarea
              className="tl-modal__textarea"
              rows={2}
              placeholder="Введите условие задачи..."
              value={form.text}
              onChange={e => setField('text', e.target.value)}
            />
            {/* Добавлена зона загрузки картинки к условию */}
            <ImageUploadZone
              label="Прикрепить картинку к условию"
              value={form.taskImage}
              onChange={v => setField('taskImage', v)}
              onError={setError}
            />
          </div>

          {/* Решение по шагам */}
          <div className="tl-modal__field">
            <label className="tl-modal__label">Решение (по шагам)</label>
            <div className="tl-modal-steps-container">
              {form.steps.map((step, i) => (
                <div key={i} className="tl-modal-step-card">
                  <div className="tl-modal-step-card__header">
                    <span>Шаг {i + 1}</span>
                    {form.steps.length > 1 && (
                      <button 
                        type="button"
                        className="tl-modal-step-card__delete" 
                        onClick={() => removeStep(i)}
                      >
                        ✕ Удалить
                      </button>
                    )}
                  </div>
                  <textarea
                    className="tl-modal__textarea"
                    rows={2}
                    placeholder="Описание шага..."
                    value={step.text}
                    onChange={e => updateStep(i, 'text', e.target.value)}
                  />
                  <ImageUploadZone
                    label="Прикрепить фото к шагу"
                    value={step.image}
                    onChange={v => updateStep(i, 'image', v)}
                    onError={setError}
                  />
                </div>
              ))}
              <button type="button" className="tl-modal__add-step-btn" onClick={addStep}>
                + Добавить шаг
              </button>
            </div>
          </div>

          {/* Ответ */}
          <div className="tl-modal__field">
            <label className="tl-modal__label">Ответ *</label>
            <textarea
              className="tl-modal__textarea tl-modal__textarea--sm"
              rows={1}
              placeholder="Например: 240 км"
              value={form.answer}
              onChange={e => setField('answer', e.target.value)}
            />
          </div>

          {/* Сложность + Год */}
          <div className="tl-modal__row">
            <div className="tl-modal__field">
              <label className="tl-modal__label">Сложность</label>
              <select
                className="tl-modal__select"
                value={form.diff}
                onChange={e => setField('diff', e.target.value)}
              >
                <option value="1">Лёгкое</option>
                <option value="2">Среднее</option>
                <option value="3">Сложное</option>
              </select>
            </div>
            <div className="tl-modal__field">
              <label className="tl-modal__label">Год задания</label>
              <YearField value={form.year} onChange={v => setField('year', v)} />
              <span className="tl-modal__hint">
                Авто = {currentYear} · или введите вручную
              </span>
            </div>
          </div>
        </div>

        {error && <p className="tl-modal__error">{error}</p>}

        <div className="tl-modal__footer">
          <button className="tl-modal__cancel" onClick={onClose}>Отмена</button>
          <button className="tl-modal__save" onClick={handleSave} disabled={loading}>
            {loading ? 'Сохранение...' : 'Добавить задание'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Модалка задать ДЗ ────────────────────────────────────────────────────────
const AssignModal = ({ cart, onClose, onAssign }) => (
  <div className="tl-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="tl-modal">
      <div className="tl-modal__header">
        <h3 className="tl-modal__title">Задать домашнее задание</h3>
        <button className="tl-modal__close" onClick={onClose}>✕</button>
      </div>

      <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
        Выбрано заданий: <strong style={{ color: '#00a86b' }}>{cart.length}</strong>
      </p>

      <div className="tl-assign-list">
        {cart.map((t, i) => (
          <div key={t.id} className="tl-assign-item">
            <span className="tl-assign-num">{i + 1}</span>
            <p className="tl-assign-text">{t.text}</p>
            <span className={`tl-tag ${DIFF_CLASS[t.diff]}`}>{DIFF_LABEL[t.diff]}</span>
          </div>
        ))}
      </div>

      <div className="tl-modal__field">
        <label className="tl-modal__label">Срок сдачи (необязательно)</label>
        <input
          type="date"
          className="tl-modal__textarea tl-modal__textarea--sm"
          style={{ resize: 'none' }}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="tl-modal__footer">
        <button className="tl-modal__cancel" onClick={onClose}>Отмена</button>
        <button className="tl-modal__save" onClick={onAssign}>
          Задать ученикам →
        </button>
      </div>
    </div>
  </div>
);

// ─── Плавающая корзина ────────────────────────────────────────────────────────
const CartWidget = ({ cart, onAssign }) => {
  if (cart.length === 0) return null;
  return (
    <div className="tl-cart-widget">
      <div className="tl-cart-icon">📚</div>
      <div className="tl-cart-info">
        <span className="tl-cart-label">В корзине ДЗ</span>
        <span className="tl-cart-count">
          {cart.length} {cart.length === 1 ? 'задание' : cart.length < 5 ? 'задания' : 'заданий'}
        </span>
      </div>
      <button className="tl-cart-btn" onClick={onAssign}>
        Задать ученикам →
      </button>
    </div>
  );
};

// ─── Главный компонент ────────────────────────────────────────────────────────
const TaskList = ({ examType, subject, groupName, subtypeName, onBack, cart, onCartToggle, onAssign }) => {
  const [sort, setSort]           = useState('default');
  const [showModal, setShowModal] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
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
      text: form.text,
      taskImage: form.taskImage, // Передаем картинку в новую задачу
      steps: form.steps,
      answer: form.answer,
      diff: form.diff,
      year: form.year,
      pop: 0,
    };
    setTasks(prev => [newTask, ...prev]);
    setShowModal(false);
  };

  const handleAssign = () => {
    setShowAssign(false);
    onAssign();
  };

  return (
    <>
      <div className="tl-wrap">
        <button className="tl-back-btn" onClick={onBack}>← Назад</button>

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

        <div className="tl-stats">
          <span className="tl-stat">Всего: {tasks.length}</span>
          <span className="tl-stat tl-stat--easy">Лёгких: {counts.easy}</span>
          <span className="tl-stat tl-stat--medium">Средних: {counts.medium}</span>
          <span className="tl-stat tl-stat--hard">Сложных: {counts.hard}</span>
          {cart.length > 0 && (
            <span className="tl-stat tl-stat--cart">🛒 В ДЗ: {cart.length}</span>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="tl-empty">
            <p className="tl-empty__icon">📋</p>
            <p className="tl-empty__text">Заданий пока нет</p>
            <p className="tl-empty__hint">Нажмите «Добавить задание», чтобы создать первое</p>
          </div>
        ) : (
          <div className="tl-list">
            {sorted.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                cart={cart}
                onCartToggle={onCartToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Плавающая корзина — всегда видна пока есть задания */}
      <CartWidget cart={cart} onAssign={() => setShowAssign(true)} />

      {showModal && (
        <AddTaskModal
          subtypeName={subtypeName}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {showAssign && (
        <AssignModal
          cart={cart}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssign}
        />
      )}
    </>
  );
};

export default TaskList;