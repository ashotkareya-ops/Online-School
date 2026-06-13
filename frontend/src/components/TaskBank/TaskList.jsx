import React, { useState, useRef, useEffect, useCallback } from 'react';
import './TaskList.css';

const API_URL = import.meta.env.VITE_API_URL;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const SORT_OPTIONS = [
  { id: 'default',  label: 'По умолчанию' },
  { id: 'easy',     label: 'Сначала простые' },
  { id: 'hard',     label: 'Сначала сложные' },
  { id: 'new',      label: 'Сначала новые' },
  { id: 'old',      label: 'Сначала старые' },
  { id: 'mine',     label: 'Мои задания' },
];

const DIFF_LABEL = { 1: 'Лёгкое', 2: 'Среднее', 3: 'Сложное' };
const DIFF_CLASS  = { 1: 'tl-tag--easy', 2: 'tl-tag--medium', 3: 'tl-tag--hard' };

const authFetch = (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
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

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { onError('Файл должен быть изображением'); return; }
    if (file.size > MAX_IMAGE_BYTES) { onError('Файл слишком большой (макс. 2 МБ)'); return; }
    const previewUrl = URL.createObjectURL(file);
    onChange({ file, previewUrl });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, []);

  if (value?.previewUrl) {
    return (
      <div className="tl-img-preview">
        <img src={value.previewUrl} alt="Прикреплённое изображение" />
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
    <div className="tl-img-zone" onClick={() => inputRef.current?.click()}
      onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
      <span className="tl-img-zone__icon">🖼️</span>
      <span className="tl-img-zone__text">{label}</span>
      <span className="tl-img-zone__hint">JPG, PNG, GIF · до 2 МБ</span>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
};

// ─── Поле года ────────────────────────────────────────────────────────────────
const YearField = ({ value, onChange }) => {
  const [isAuto, setIsAuto] = useState(true);
  const currentYear = new Date().getFullYear();

  const toggleAuto = () => {
    if (!isAuto) onChange(currentYear);
    setIsAuto(v => !v);
  };

  return (
    <div className="tl-year-wrap">
      <input type="number" className="tl-year-input" value={value}
        min={2000} max={currentYear + 1} readOnly={isAuto}
        onChange={e => !isAuto && onChange(Number(e.target.value))} />
      <button type="button" className={`tl-year-auto ${isAuto ? 'active' : ''}`} onClick={toggleAuto}>
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
          {task.steps?.map((step, i) => (
            <div key={i} className="tl-solution__step">
              <div className="tl-solution__step-num">{i + 1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {step.text && <p className="tl-solution__step-text">{step.text}</p>}
                {/* Поддержка и старого поля image, и нового image_url */}
                {(step.image || step.image_url) && (
                  <img src={step.image || step.image_url} alt={`К шагу ${i + 1}`} className="tl-solution__step-img" />
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
          {/* taskImage — с бэкенда это URL из S3 */}
          {task.taskImage && (
            <img src={task.taskImage} alt="К условию" className="tl-card__task-img" />
          )}
          <div className="tl-card__meta">
            <span className={`tl-tag ${DIFF_CLASS[task.diff] || DIFF_CLASS[1]}`}>
              {DIFF_LABEL[task.diff]}
            </span>
            <span className="tl-tag tl-tag--neutral">{task.year}</span>
            
            {/* Убираем лайки, ставим иконку «Моё задание» */}
            {task.isMine && (
              <span className="tl-tag tl-tag--mine-icon" title="Задание добавлено мной">
                Добавленное мной
              </span>
            )}
          </div>
        </div>
        <div className="tl-card-actions">
          <button className={`tl-add-hw-btn ${inCart ? 'added' : ''}`}
            onClick={() => onCartToggle(task)} title={inCart ? 'Убрать из ДЗ' : 'Добавить в ДЗ'}>
            {inCart ? '✓' : '+'}
          </button>
          <button className={`tl-card__btn ${open ? 'active' : ''}`} onClick={() => setOpen(v => !v)}>
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
    text: '', answer: '', taskImage: null,
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

  const handleSave = async () => {
    if (!form.text.trim() && !form.taskImage) {
      setError('Введите текст задания или прикрепите изображение'); return;
    }
    if (!form.answer.trim()) { setError('Введите ответ'); return; }
    const validSteps = form.steps.filter(s => s.text.trim() !== '' || s.image !== null);
    if (validSteps.length === 0) { setError('Добавьте хотя бы один шаг решения'); return; }

    setError('');
    setLoading(true);
    await onSave({ ...form, diff: Number(form.diff), year: Number(form.year), steps: validSteps });
    setLoading(false);
  };

  return (
    <div className="tl-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tl-modal">
        <div className="tl-modal__header">
          <h3 className="tl-modal__title">Добавить задание</h3>
          <button className="tl-modal__close" onClick={onClose}>✕</button>
        </div>

        {subtypeName && <div className="tl-modal__crumb">Тип: <strong>{subtypeName}</strong></div>}

        <div className="tl-modal__fields">
          <div className="tl-modal__field">
            <label className="tl-modal__label">Условие задания *</label>
            <textarea className="tl-modal__textarea" rows={2} placeholder="Введите условие задачи..."
              value={form.text} onChange={e => setField('text', e.target.value)} />
            <ImageUploadZone label="Прикрепить картинку к условию"
              value={form.taskImage} onChange={v => setField('taskImage', v)} onError={setError} />
          </div>

          <div className="tl-modal__field">
            <label className="tl-modal__label">Решение (по шагам)</label>
            <div className="tl-modal-steps-container">
              {form.steps.map((step, i) => (
                <div key={i} className="tl-modal-step-card">
                  <div className="tl-modal-step-card__header">
                    <span>Шаг {i + 1}</span>
                    {form.steps.length > 1 && (
                      <button type="button" className="tl-modal-step-card__delete"
                        onClick={() => setForm({ ...form, steps: form.steps.filter((_, idx) => idx !== i) })}>
                        ✕ Удалить
                      </button>
                    )}
                  </div>
                  <textarea className="tl-modal__textarea" rows={2} placeholder="Описание шага..."
                    value={step.text} onChange={e => updateStep(i, 'text', e.target.value)} />
                  <ImageUploadZone label="Прикрепить фото к шагу"
                    value={step.image} onChange={v => updateStep(i, 'image', v)} onError={setError} />
                </div>
              ))}
              <button type="button" className="tl-modal__add-step-btn"
                onClick={() => setForm({ ...form, steps: [...form.steps, { text: '', image: null }] })}>
                + Добавить шаг
              </button>
            </div>
          </div>

          <div className="tl-modal__field">
            <label className="tl-modal__label">Ответ *</label>
            <textarea className="tl-modal__textarea tl-modal__textarea--sm" rows={1}
              placeholder="Например: 240 км" value={form.answer}
              onChange={e => setField('answer', e.target.value)} />
          </div>

          <div className="tl-modal__row">
            <div className="tl-modal__field">
              <label className="tl-modal__label">Сложность</label>
              <select className="tl-modal__select" value={form.diff}
                onChange={e => setField('diff', e.target.value)}>
                <option value="1">Лёгкое</option>
                <option value="2">Среднее</option>
                <option value="3">Сложное</option>
              </select>
            </div>
            <div className="tl-modal__field">
              <label className="tl-modal__label">Год задания</label>
              <YearField value={form.year} onChange={v => setField('year', v)} />
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
const AssignModal = ({ cart, examType, subject, onClose, onAssign, onCartToggle }) => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [autoCheck, setAutoCheck] = useState(false);

  useEffect(() => {
  const fetchFilteredStudents = async () => {
    setIsLoading(true);
    try {
      // Гарантируем, что тип экзамена пойдет маленькими буквами ('ege' / 'oge')
      const examParam = examType ? String(examType).toLowerCase() : '';
      const subjectParam = subject ? String(subject).trim() : '';

      const res = await authFetch(
        `${API_URL}/api/teacher/students/?exam_type=${examParam}&subject=${encodeURIComponent(subjectParam)}`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке студентов учителя:', err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchFilteredStudents();
}, [examType, subject]);

  const isAllSelected = students.length > 0 && selectedStudents.length === students.length;

  const toggleAll = () => setSelectedStudents(isAllSelected ? [] : students.map(s => s.id));
  const toggleStudent = (id) => setSelectedStudents(prev =>
    prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
  );

  const getStudentName = (student) => {
    if (student.first_name || student.last_name) {
      return `${student.last_name || ''} ${student.first_name || ''}`.trim();
    }
    return student.username;
  };

  return (
    <div className="tl-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tl-modal">

        {/* Шапка */}
        <div className="tl-modal__header">
          <h3 className="tl-modal__title">Задать домашнее задание</h3>
          <button className="tl-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* ── Выбранные задания: чипы ── */}
        <div className="tl-assign-tasks-block">
          <div className="tl-assign-tasks-block__header">
            <span className="tl-assign-tasks-block__title">
              Выбранные задания
              <span className="tl-assign-tasks-block__badge">{cart.length}</span>
            </span>
            <span className="tl-assign-tasks-block__filter">
              {examType === 'oge' ? 'ОГЭ' : 'ЕГЭ'} · {subject}
            </span>
          </div>
          <div className="tl-task-chips">
            {cart.map((task, idx) => {
              const label = task.text
                ? (task.text.length > 32 ? task.text.slice(0, 32) + '…' : task.text)
                : '🖼 Картинка';
              return (
                <button
                  key={task.id}
                  type="button"
                  className="tl-task-chip"
                  onClick={() => onCartToggle(task)}
                  title="Нажмите, чтобы убрать из ДЗ"
                >
                  <span className="tl-task-chip__num">{idx + 1}</span>
                  <span className="tl-task-chip__label">{label}</span>
                  <span className="tl-task-chip__remove">✕</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Кому назначить ── */}
        <div className="tl-modal__field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="tl-modal__label">Кому назначить? *</label>
            {students.length > 0 && (
              <label className="tl-student-select-all">
                <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
                <span>Выбрать всех</span>
              </label>
            )}
          </div>
          <div className="tl-students-list">
            {isLoading ? (
              <p style={{ fontSize: 14, color: '#666', textAlign: 'center', padding: '10px' }}>
                Загрузка списка учеников...
              </p>
            ) : students.length === 0 ? (
              <p style={{ fontSize: 14, color: '#999', textAlign: 'center', padding: '10px' }}>
                У вас нет учеников, сдающих {examType === 'oge' ? 'ОГЭ' : 'ЕГЭ'} по предмету «{subject}».
              </p>
            ) : (
              students.map(student => {
                const fullName = getStudentName(student);
                return (
                  <label key={student.id} className="tl-student-item">
                    <input type="checkbox" className="tl-student-checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)} />
                    <div className="tl-student-avatar">
                      {fullName.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="tl-student-name">{fullName}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* ── Автопроверка — под списком учеников ── */}
        <div className="tl-autocheck">
          <div className="tl-autocheck__row">
            <div className="tl-autocheck__info">
              <span className="tl-autocheck__label">Автопроверка</span>
              <span className="tl-autocheck__desc">
                {autoCheck
                  ? 'Система сверит ответ с эталоном автоматически'
                  : 'Вы проверяете и выставляете оценку вручную'}
              </span>
            </div>
            <button
              type="button"
              className={`tl-autocheck__toggle ${autoCheck ? 'on' : 'off'}`}
              onClick={() => setAutoCheck(v => !v)}
              aria-label="Переключить автопроверку"
            >
              <span className="tl-autocheck__thumb" />
            </button>
          </div>
          <div className={`tl-autocheck__mode ${autoCheck ? 'auto' : 'manual'}`}>
            <span className="tl-autocheck__mode-icon">{autoCheck ? '⚡' : '👨‍🏫'}</span>
            <span>
              {autoCheck
                ? 'Ученик сразу увидит результат после отправки'
                : 'Ученик увидит результат после вашей проверки'}
            </span>
          </div>
        </div>

        {/* ── Срок сдачи ── */}
        <div className="tl-modal__field">
          <label className="tl-modal__label">Срок сдачи (необязательно)</label>
          <input type="date" className="tl-modal__textarea tl-modal__textarea--sm"
            style={{ resize: 'none' }} value={deadline}
            onChange={e => setDeadline(e.target.value)}
            min={new Date().toISOString().split('T')[0]} />
        </div>

        <div className="tl-modal__footer">
          <button className="tl-modal__cancel" onClick={onClose}>Отмена</button>
          <button className="tl-modal__save"
            disabled={isLoading || !selectedStudents.length || cart.length === 0}
            onClick={() => {
              if (!selectedStudents.length) { alert('Выберите хотя бы одного ученика'); return; }
              onAssign({ students: selectedStudents, deadline, auto_check: autoCheck });
            }}
          >
            Задать ученикам →
          </button>
        </div>
      </div>
    </div>
  );
};

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
      <button className="tl-cart-btn" onClick={onAssign}>Задать ученикам →</button>
    </div>
  );
};

// ─── Главный компонент ────────────────────────────────────────────────────────
// subtype теперь объект { id, name }, а не просто строка
const TaskList = ({ examType, subject, subjectId, groupName, subtype, onBack, cart, onCartToggle, onAssign, onTaskAdded }) => {
  const [sort, setSort]             = useState('default');
  const [showModal, setShowModal]   = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [tasks, setTasks]           = useState([]);
  const [isLoading, setIsLoading]   = useState(false);

  // Загрузка заданий с бэкенда
  useEffect(() => {
    if (!subtype?.id) return;
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const res = await authFetch(
          `${API_URL}/api/tasks/list/?subtype_id=${subtype.id}&sort=${sort}`
        );
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch {
        console.error('Ошибка загрузки заданий');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [subtype?.id, sort]);

  // Отправка нового задания на бэкенд
  const handleSave = async (form) => {
    const formData = new FormData();
    formData.append('subtype_id', subtype.id);
    formData.append('text', form.text);
    formData.append('answer', form.answer);
    formData.append('diff', form.diff);
    formData.append('year', form.year);

    if (form.taskImage?.file) {
      formData.append('task_image', form.taskImage.file);
    }

    const stepsData = form.steps.map((step, index) => {
      if (step.image?.file) {
        formData.append(`step_image_${index}`, step.image.file);
      }
      return { text: step.text, imageIndex: step.image?.file ? index : null };
    });
    formData.append('steps', JSON.stringify(stepsData));

    try {
      const res = await authFetch(`${API_URL}/api/tasks/`, {
        method: 'POST',
        body: formData,
        // НЕ ставим Content-Type вручную — браузер сам добавит boundary для FormData
      });

      if (!res.ok) {
        const err = await res.json();
        alert(Object.values(err).flat().join(' '));
        return;
      }

      const newTask = await res.json();
      setTasks(prev => [newTask, ...prev]);
      setShowModal(false);

      // Обновляем счётчик total в родителе
      if (onTaskAdded) onTaskAdded(subtype.id);
    } catch {
      alert('Ошибка соединения с сервером');
    }
  };

  const counts = {
    easy:   tasks.filter(t => t.diff === 1).length,
    medium: tasks.filter(t => t.diff === 2).length,
    hard:   tasks.filter(t => t.diff === 3).length,
  };

  return (
    <>
      <div className="tl-wrap">
        <button className="tl-back-btn" onClick={onBack}>← Назад</button>

        <div className="tl-header">
          <div className="tl-header__left">
            <h2 className="tl-title">{subtype?.name}</h2>
            <div className="tl-crumbs">
              <span className="tl-crumb">{examType === 'oge' ? 'ОГЭ' : 'ЕГЭ'}</span>
              <span className="tl-crumb-sep">·</span>
              <span className="tl-crumb">{subject}</span>
              <span className="tl-crumb-sep">·</span>
              <span className="tl-crumb">{groupName}</span>
              <span className="tl-crumb-sep">·</span>
              <span className="tl-crumb tl-crumb--active">{subtype?.name}</span>
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
          {cart.length > 0 && <span className="tl-stat tl-stat--cart">🛒 В ДЗ: {cart.length}</span>}
        </div>

        {isLoading ? (
          <div className="tl-empty"><p className="tl-empty__text">Загрузка заданий...</p></div>
        ) : tasks.length === 0 ? (
          <div className="tl-empty">
            <p className="tl-empty__icon">📋</p>
            <p className="tl-empty__text">Заданий пока нет</p>
            <p className="tl-empty__hint">Нажмите «Добавить задание», чтобы создать первое</p>
          </div>
        ) : (
          <div className="tl-list">
            {tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} cart={cart} onCartToggle={onCartToggle} />
            ))}
          </div>
        )}
      </div>

      <CartWidget cart={cart} onAssign={() => setShowAssign(true)} />

      {showModal && (
        <AddTaskModal subtypeName={subtype?.name} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
      {showAssign && (
        <AssignModal 
          cart={cart} 
          examType={examType} 
          subject={subject} 
          onCartToggle={onCartToggle} // <- Добавили этот пропс[cite: 1]
          onClose={() => setShowAssign(false)}
          onAssign={(data) => { setShowAssign(false); onAssign(data); }} 
        />
      )}
    </>
  );
};

export default TaskList;