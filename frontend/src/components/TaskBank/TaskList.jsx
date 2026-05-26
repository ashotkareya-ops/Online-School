import React, { useState, useRef, useEffect, useCallback } from 'react';
import './TaskList.css';

// ─── Константы UI (Остаются во фронтенде) ─────────────────────────────────────
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 МБ

const SORT_OPTIONS = [
  { id: 'default',  label: 'По умолчанию' },
  { id: 'easy',     label: 'Сначала простые' },
  { id: 'hard',     label: 'Сначала сложные' },
  { id: 'popular',  label: 'По популярности' },
  { id: 'new',      label: 'Сначала новые' },
  { id: 'old',      label: 'Сначала старые' },
];

const DIFF_LABEL  = { 1: 'Лёгкое', 2: 'Среднее', 3: 'Сложное' };
const DIFF_CLASS  = { 1: 'tl-tag--easy', 2: 'tl-tag--medium', 3: 'tl-tag--hard' };

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

// ─── Зона загрузки картинки (Возвращает объект File + Preview URL) ────────────
const ImageUploadZone = ({ label, value, onChange, onError }) => {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { onError('Файл должен быть изображением'); return; }
    if (file.size > MAX_IMAGE_BYTES) { onError('Файл слишком большой (макс. 2 МБ)'); return; }
    
    // Создаем ссылку для предпросмотра, а сам файл сохраняем для отправки на бэкенд
    const previewUrl = URL.createObjectURL(file);
    onChange({ file, previewUrl });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const handleDragOver = (e) => e.preventDefault();

  if (value && value.previewUrl) {
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
          {task.steps?.map((step, i) => (
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
          {task.taskImage && (
             <img src={task.taskImage} alt="К условию" className="tl-card__task-img" />
          )}
          <div className="tl-card__meta">
            <span className={`tl-tag ${DIFF_CLASS[task.diff] || DIFF_CLASS[1]}`}>{DIFF_LABEL[task.diff]}</span>
            <span className="tl-tag tl-tag--neutral">♥ {task.pop || 0}</span>
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
    taskImage: null,
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
    if (!form.text.trim() && !form.taskImage) { 
      setError('Введите текст задания или прикрепите изображение к условию'); 
      return; 
    }
    if (!form.answer.trim()) { 
      setError('Введите ответ'); 
      return; 
    }
    
    const validSteps = form.steps.filter(s => s.text.trim() !== '' || s.image !== null);
    if (validSteps.length === 0) { 
      setError('Добавьте хотя бы один шаг решения (с текстом или картинкой)'); 
      return; 
    }

    setError('');
    setLoading(true);
    
    // Передаем форму наверх. Логика отправки FormData теперь в родительском компоненте.
    await onSave({
      ...form,
      diff: Number(form.diff),
      year: Number(form.year),
      steps: validSteps,
    });
    
    setLoading(false);
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
            <label className="tl-modal__label">Условие задания *</label>
            <textarea
              className="tl-modal__textarea"
              rows={2}
              placeholder="Введите условие задачи..."
              value={form.text}
              onChange={e => setField('text', e.target.value)}
            />
            <ImageUploadZone
              label="Прикрепить картинку к условию"
              value={form.taskImage}
              onChange={v => setField('taskImage', v)}
              onError={setError}
            />
          </div>

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
// ─── Модалка задать ДЗ ────────────────────────────────────────────────────────
const AssignModal = ({ cart, onClose, onAssign }) => {
  // Моковый список учеников (в будущем будет приходить с бэкенда)
  const MOCK_STUDENTS = [
    { id: 1, name: 'Иван Иванов' },
    { id: 2, name: 'Анна Смирнова' },
    { id: 3, name: 'Петр Петров' },
    { id: 4, name: 'Елена Соколова' },
    { id: 5, name: 'Дмитрий Волков' },
    { id: 6, name: 'Мария Кузнецова' },
  ];

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [deadline, setDeadline] = useState('');

  // Проверка: выбраны ли все ученики
  const isAllSelected = selectedStudents.length === MOCK_STUDENTS.length && MOCK_STUDENTS.length > 0;

  // Логика выбора всех учеников разом
  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedStudents([]); // Снять выбор со всех
    } else {
      setSelectedStudents(MOCK_STUDENTS.map(s => s.id)); // Выбрать всех
    }
  };

  // Логика выбора одного ученика
  const toggleStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleSubmit = () => {
    if (selectedStudents.length === 0) {
      alert('Пожалуйста, выберите хотя бы одного ученика');
      return;
    }
    // Передаем выбранных учеников и дедлайн наверх
    onAssign({
      students: selectedStudents,
      deadline: deadline
    });
  };

  return (
    <div className="tl-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tl-modal">
        <div className="tl-modal__header">
          <h3 className="tl-modal__title">Задать домашнее задание</h3>
          <button className="tl-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Компактный блок с количеством заданий */}
        <div className="tl-modal__field" style={{ marginBottom: '4px' }}>
          <p style={{ fontSize: 14, color: '#555', margin: 0, fontWeight: 600 }}>
            Выбрано заданий: <strong style={{ color: '#00a86b', fontSize: 16 }}>{cart.length}</strong>
          </p>
        </div>

        {/* Блок выбора учеников */}
        <div className="tl-modal__field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="tl-modal__label">Кому назначить? *</label>
            <label className="tl-student-select-all">
              <input 
                type="checkbox" 
                checked={isAllSelected} 
                onChange={toggleAll} 
              />
              <span>Выбрать всех</span>
            </label>
          </div>
          
          <div className="tl-students-list">
            {MOCK_STUDENTS.map(student => (
              <label key={student.id} className="tl-student-item">
                <input 
                  type="checkbox" 
                  className="tl-student-checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                />
                <div className="tl-student-avatar">{student.name.charAt(0)}</div>
                <span className="tl-student-name">{student.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Срок сдачи */}
        <div className="tl-modal__field">
          <label className="tl-modal__label">Срок сдачи (необязательно)</label>
          <input
            type="date"
            className="tl-modal__textarea tl-modal__textarea--sm"
            style={{ resize: 'none' }}
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="tl-modal__footer">
          <button className="tl-modal__cancel" onClick={onClose}>Отмена</button>
          <button className="tl-modal__save" onClick={handleSubmit}>
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
  const [tasks, setTasks]         = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. ПОЛУЧЕНИЕ ЗАДАНИЙ С БЭКЕНДА
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        // TODO: Раскомментируй и подставь свой API
        // Заметь: теперь мы передаем параметр sort прямиком на бэкенд!
        // const response = await axios.get(`/api/tasks/?subtype=${subtypeName}&sort=${sort}`);
        // setTasks(response.data);
      } catch (error) {
        console.error("Ошибка загрузки заданий:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Эффект срабатывает каждый раз, когда меняется подтип ИЛИ пользователь меняет сортировку
    fetchTasks();
  }, [subtypeName, sort]); 

  const counts = {
    easy:   tasks.filter(t => t.diff === 1).length,
    medium: tasks.filter(t => t.diff === 2).length,
    hard:   tasks.filter(t => t.diff === 3).length,
  };

  // 2. ОТПРАВКА НОВОГО ЗАДАНИЯ НА БЭКЕНД
  const handleSave = async (form) => {
    // Подготовка данных для отправки файлов
    const formData = new FormData();
    formData.append('text', form.text);
    formData.append('answer', form.answer);
    formData.append('diff', form.diff);
    formData.append('year', form.year);
    
    // Если есть картинка к условию - прикрепляем сам файл
    if (form.taskImage?.file) {
      formData.append('task_image', form.taskImage.file);
    }

    // Подготовка шагов решения
    const stepsData = form.steps.map((step, index) => {
      if (step.image?.file) {
        formData.append(`step_image_${index}`, step.image.file);
      }
      return { text: step.text, imageIndex: step.image?.file ? index : null };
    });
    formData.append('steps', JSON.stringify(stepsData));

    try {
      // TODO: Раскомментируй для отправки на сервер
      // const response = await axios.post('/api/tasks/', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
      // const newTask = response.data;
      
      // ВРЕМЕННАЯ ЗАГЛУШКА (Удали, когда подключишь бэкенд)
      const newTask = {
        id: Date.now(),
        text: form.text,
        taskImage: form.taskImage?.previewUrl, // Для немедленного отображения в UI
        steps: form.steps.map(s => ({ text: s.text, image: s.image?.previewUrl })),
        answer: form.answer,
        diff: form.diff,
        year: form.year,
        pop: 0,
      };

      setTasks(prev => [newTask, ...prev]); // Добавляем новую задачу локально (или можно сделать повторный GET запрос)
      setShowModal(false);
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      alert("Не удалось сохранить задание");
    }
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
            {/* При смене значения в дропдауне, обновится стейт `sort`, и сработает useEffect с запросом */}
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

        {isLoading ? (
          <div className="tl-empty">
            <p className="tl-empty__text">Загрузка заданий...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="tl-empty">
            <p className="tl-empty__icon">📋</p>
            <p className="tl-empty__text">Заданий пока нет</p>
            <p className="tl-empty__hint">Нажмите «Добавить задание», чтобы создать первое</p>
          </div>
        ) : (
          <div className="tl-list">
            {/* Рендерим напрямую tasks, так как бэкенд вернет их уже отсортированными */}
            {tasks.map((task, i) => (
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