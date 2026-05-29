import React, { useState, useEffect } from 'react';
import TaskList from './TaskList';
import './TaskBank.css';

const API_URL = import.meta.env.VITE_API_URL;
const EXAM_LABELS = { oge: 'ОГЭ', ege: 'ЕГЭ' };
const EXAM_ICONS  = { oge: '📝', ege: '🎓' };
const EXAM_DESCS  = {
  oge: 'Основной государственный экзамен',
  ege: 'Единый государственный экзамен',
};

// ─── Вспомогательная функция для авторизованных запросов ─────────────────────
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

// ─── Модалка добавления группы и подтипов ─────────────────────────────────────
const AddGroupModal = ({ onClose, onSave, subject, subjectId }) => {
  const [name, setName] = useState('');
  const [subtypes, setSubtypes] = useState([{ name: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSubtype = () => setSubtypes([...subtypes, { name: '' }]);

  const handleRemoveSubtype = (index) => {
    if (subtypes.length > 1) setSubtypes(subtypes.filter((_, i) => i !== index));
  };

  const handleSubtypeChange = (index, value) => {
    const newSubtypes = [...subtypes];
    newSubtypes[index].name = value;
    setSubtypes(newSubtypes);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Введите название задания (темы)'); return; }
    const validSubtypes = subtypes.filter(s => s.name.trim() !== '');
    if (validSubtypes.length === 0) { setError('Добавьте хотя бы один подтип'); return; }

    setError('');
    setLoading(true);

    try {
      const response = await authFetch(`${API_URL}/api/tasks/groups/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          name: name.trim(),
          subtypes: validSubtypes.map(s => ({ name: s.name.trim() })),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(Object.values(err).flat().join(' '));
        return;
      }

      const savedGroup = await response.json();
      onSave(savedGroup); // Передаём реальный объект с id из БД
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tb-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tb-modal">
        <div className="tb-modal__header">
          <h3 className="tb-modal__title">Добавить новое задание</h3>
          <button className="tb-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="tb-modal__crumb">
          Предмет: <strong>{subject}</strong>
        </div>

        <div className="tb-modal__fields">
          <div className="tb-modal__field">
            <label className="tb-modal__label">Название темы / Задания *</label>
            <input
              type="text"
              className="tb-modal__input"
              placeholder="Например: Системы счисления"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="tb-modal__field">
            <label className="tb-modal__label">Подтипы заданий *</label>
            <div className="tb-subtype-list">
              {subtypes.map((sub, i) => (
                <div key={i} className="tb-subtype-input-wrap">
                  <input
                    type="text"
                    className="tb-modal__input"
                    placeholder={`Подтип ${i + 1}...`}
                    value={sub.name}
                    onChange={e => handleSubtypeChange(i, e.target.value)}
                  />
                  {subtypes.length > 1 && (
                    <button
                      type="button"
                      className="tb-subtype-remove-btn"
                      onClick={() => handleRemoveSubtype(i)}
                      title="Удалить подтип"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="tb-modal__add-sub-btn" onClick={handleAddSubtype}>
              + Добавить подтип
            </button>
          </div>
        </div>

        {error && <p className="tb-modal__error">{error}</p>}

        <div className="tb-modal__footer">
          <button className="tb-modal__cancel" onClick={onClose}>Отмена</button>
          <button className="tb-modal__save" onClick={handleSave} disabled={loading}>
            {loading ? 'Сохранение...' : 'Добавить задание'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Строка подтипа ───────────────────────────────────────────────────────────
const SubtypeRow = ({ subtype, checked, count, onToggle, onCountChange, onOpenList }) => (
  <div className="tb-subtype-row">
    <div className={`tb-subtype-check ${checked ? 'checked' : ''}`} onClick={onToggle} />
    <span
      className="tb-subtype-name tb-subtype-name--link"
      onClick={onOpenList}
      title="Открыть все задания этого типа"
    >
      {subtype.name}
      <span className="tb-subtype-link-icon">↗</span>
    </span>
    <span className="tb-subtype-total">{subtype.total} шт.</span>
    <div
      className="tb-count-wrap"
      style={{ opacity: checked ? 1 : 0.3, pointerEvents: checked ? 'auto' : 'none' }}
    >
      <button className="tb-count-btn" onClick={() => onCountChange(-1)}>−</button>
      <span className="tb-count-val">{count}</span>
      <button className="tb-count-btn" onClick={() => onCountChange(1)}>+</button>
    </div>
  </div>
);

// ─── Группа аккордеон ─────────────────────────────────────────────────────────
const TaskGroup = ({ group, index, isOpen, onToggle, checked, counts, onSubtypeToggle, onCountChange, onOpenList }) => (
  <div className={`tb-group ${isOpen ? 'open' : ''}`}>
    <div className="tb-group-header" onClick={onToggle}>
      <div className={`tb-group-num ${isOpen ? 'open' : ''}`}>{index + 1}</div>
      <span className="tb-group-name">{group.name}</span>
      <span className="tb-group-badge">
        {group.subtypes.length} {group.subtypes.length === 1 ? 'тип' : 'типа'}
      </span>
      <span className={`tb-chevron ${isOpen ? 'open' : ''}`}>▼</span>
    </div>
    {isOpen && (
      <div className="tb-subtypes">
        {group.subtypes.map(s => (
          <SubtypeRow
            key={s.id}
            subtype={s}
            checked={!!checked[s.id]}
            count={counts[s.id] || (s.total > 0 ? Math.min(5, s.total) : 0)}
            onToggle={() => onSubtypeToggle(s.id, s.total)}
            onCountChange={(delta) => onCountChange(s.id, delta, s.total)}
            onOpenList={() => onOpenList(group, s)}
          />
        ))}
      </div>
    )}
  </div>
);

// ─── Шаг банка заданий ────────────────────────────────────────────────────────
const TaskBankStep = ({ examType, subject, subjectId, tasks, isLoading, onAddGroup, onBack, onOpenList }) => {
  const [openGroup, setOpenGroup] = useState(null);
  const [checked, setChecked]     = useState({});
  const [counts, setCounts]       = useState({});
  const [showAddModal, setShowAddModal] = useState(false);

  const handleToggleGroup = (id) => setOpenGroup(prev => prev === id ? null : id);

  const handleSubtypeToggle = (sid, total) => {
    setChecked(prev => {
      const next = { ...prev, [sid]: !prev[sid] };
      if (next[sid] && !counts[sid] && total > 0)
        setCounts(c => ({ ...c, [sid]: Math.min(5, total) }));
      return next;
    });
  };

  const handleCountChange = (sid, delta, total) => {
    if (total === 0) return;
    setCounts(prev => ({
      ...prev,
      [sid]: Math.max(1, Math.min(total, (prev[sid] || 1) + delta)),
    }));
  };

  const handleSaveNewGroup = (savedGroup) => {
    onAddGroup(savedGroup);
    setShowAddModal(false);
  };

  const checkedEntries = Object.entries(checked).filter(([, v]) => v);
  const totalTasks = checkedEntries.reduce((sum, [k]) => sum + (counts[k] || 0), 0);
  const totalTypes = checkedEntries.length;

  return (
    <div className="tb-step">
      <button className="tb-back-btn" onClick={onBack}>← Назад</button>

      <div className="tb-header">
        <div>
          <h2 className="tb-title">Банк заданий</h2>
          <div className="tb-breadcrumb">
            <span className="tb-crumb">{EXAM_LABELS[examType]}</span>
            <span className="tb-crumb-sep">·</span>
            <span className="tb-crumb">{subject}</span>
          </div>
        </div>
        <button className="tb-add-btn" onClick={() => setShowAddModal(true)}>
          + Добавить задание
        </button>
      </div>

      {isLoading ? (
        <div className="tb-empty">
          <p className="tb-empty__text">Загрузка данных...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="tb-empty">
          <div className="tb-empty__icon">📋</div>
          <p className="tb-empty__text">Задания пока не добавлены</p>
          <p className="tb-empty__hint">Нажмите «Добавить задание», чтобы создать первую тему</p>
        </div>
      ) : (
        <>
          <div className="tb-groups">
            {tasks.map((group, index) => (
              <TaskGroup
                key={group.id}
                group={group}
                index={index}
                isOpen={openGroup === group.id}
                onToggle={() => handleToggleGroup(group.id)}
                checked={checked}
                counts={counts}
                onSubtypeToggle={handleSubtypeToggle}
                onCountChange={handleCountChange}
                onOpenList={(g, s) => onOpenList(g, s)}
              />
            ))}
          </div>

          <div className="tb-footer">
            <span className="tb-footer__info">
              Отмечено:{' '}
              <strong style={{ color: '#00a86b' }}>
                {totalTypes} {totalTypes === 1 ? 'тип' : 'типа'} · {totalTasks} заданий
              </strong>
            </span>
          </div>
        </>
      )}

      {showAddModal && (
        <AddGroupModal
          subject={subject}
          subjectId={subjectId}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveNewGroup}
        />
      )}
    </div>
  );
};

// ─── Шаг 1: Выбор экзамена ───────────────────────────────────────────────────
const ExamStep = ({ examTypes, onSelect }) => (
  <div className="tb-step">
    <h2 className="tb-title">Банк заданий</h2>
    <p className="tb-subtitle">Выберите тип экзамена</p>
    <div className="tb-options">
      {examTypes.map(type => (
        <button key={type} className="tb-option-btn" onClick={() => onSelect(type)}>
          <div className="tb-option-btn__left">
            <div className="tb-option-btn__icon">{EXAM_ICONS[type]}</div>
            <div>
              <div className="tb-option-btn__name">{EXAM_LABELS[type]}</div>
              <div className="tb-option-btn__desc">{EXAM_DESCS[type]}</div>
            </div>
          </div>
          <span className="tb-option-btn__arrow">→</span>
        </button>
      ))}
    </div>
  </div>
);

// ─── Шаг 2: Выбор предмета ───────────────────────────────────────────────────
const SubjectStep = ({ examType, subjects, onSelect, onBack }) => (
  <div className="tb-step">
    {onBack && <button className="tb-back-btn" onClick={onBack}>← Назад</button>}
    <h2 className="tb-title">Выберите предмет</h2>
    <div className="tb-breadcrumb">
      <span className="tb-crumb">{EXAM_LABELS[examType]}</span>
      <span className="tb-crumb-sep">·</span>
      <span style={{ fontSize: '12px', color: '#aaa' }}>выберите предмет</span>
    </div>
    <div className="tb-subjects-grid">
      {subjects.map(subject => (
        <button key={subject.id} className="tb-subject-btn" onClick={() => onSelect(subject)}>
          {subject.name}
          <span className="tb-subject-btn__arrow">→</span>
        </button>
      ))}
    </div>
  </div>
);

// ─── Корневой компонент ───────────────────────────────────────────────────────
const TaskBank = ({ user }) => {
  const [step, setStep]                         = useState('exam');
  const [selectedExam, setSelectedExam]         = useState(null);
  const [selectedSubject, setSelectedSubject]   = useState(null); // { id, name }
  const [selectedGroup, setSelectedGroup]       = useState(null);
  const [selectedSubtype, setSelectedSubtype]   = useState(null);

  // subjects из API: [{ id, name }]
  const [subjects, setSubjects]   = useState([]);
  const [taskData, setTaskData]   = useState({});  // { subjectId: [...groups] }
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart]           = useState([]);

  const examTypes   = user?.exam_type || [];
  const skipExamStep = examTypes.length === 1;

  // Если один экзамен — сразу переходим к предметам
  useEffect(() => {
    if (skipExamStep && examTypes.length === 1) {
      setSelectedExam(examTypes[0]);
      setStep('subject');
    }
  }, []);

  // Загрузка предметов при выборе экзамена
  useEffect(() => {
    if (!selectedExam) return;
    const fetchSubjects = async () => {
      try {
        const res = await authFetch(`${API_URL}/api/tasks/subjects/?exam_type=${selectedExam}`);
        if (res.ok) {
          const data = await res.json();
          setSubjects(data); // [{ id, name }]
        }
      } catch {
        console.error('Ошибка загрузки предметов');
      }
    };
    fetchSubjects();
  }, [selectedExam]);

  // Загрузка групп (категорий) при выборе предмета
  useEffect(() => {
    if (step !== 'bank' || !selectedSubject) return;

    // Если уже загружали для этого предмета — не перезапрашиваем
    if (taskData[selectedSubject.id] !== undefined) return;

    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const res = await authFetch(`${API_URL}/api/tasks/groups/?subject_id=${selectedSubject.id}`);
        if (res.ok) {
          const data = await res.json();
          setTaskData(prev => ({ ...prev, [selectedSubject.id]: data }));
        }
      } catch {
        console.error('Ошибка загрузки тем');
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, [step, selectedSubject]);

  // Добавление новой группы (ответ уже пришёл с бэка, просто добавляем в стейт)
  const handleAddGroup = (savedGroup) => {
    setTaskData(prev => ({
      ...prev,
      [selectedSubject.id]: [...(prev[selectedSubject.id] || []), savedGroup],
    }));
  };

  const toggleCartItem = (task) => {
    setCart(prev => {
      const exists = prev.find(t => t.id === task.id);
      return exists ? prev.filter(t => t.id !== task.id) : [...prev, task];
    });
  };

  const handleAssign = () => {
    setCart([]);
    alert('ДЗ успешно задано ученикам!');
  };

  const handleSelectExam    = (exam)    => { setSelectedExam(exam); setStep('subject'); };
  const handleSelectSubject = (subject) => { setSelectedSubject(subject); setStep('bank'); };
  const handleOpenList = (group, subtype) => {
    setSelectedGroup(group);
    setSelectedSubtype(subtype);
    setStep('list');
  };
  const handleBack = () => {
    if (step === 'list')    { setStep('bank'); return; }
    if (step === 'bank')    { setStep('subject'); return; }
    if (step === 'subject' && !skipExamStep) { setStep('exam'); return; }
  };

  // Обновление счётчика total после добавления задания
  const handleTaskAdded = (subtypeId) => {
    setTaskData(prev => {
      const groups = prev[selectedSubject.id] || [];
      return {
        ...prev,
        [selectedSubject.id]: groups.map(group => ({
          ...group,
          subtypes: group.subtypes.map(sub =>
            sub.id === subtypeId ? { ...sub, total: sub.total + 1 } : sub
          ),
        })),
      };
    });
  };

  const currentTasks = selectedSubject ? (taskData[selectedSubject.id] || []) : [];

  return (
    <>
      {step === 'list' && (
        <TaskList
          examType={selectedExam}
          subject={selectedSubject?.name}
          subjectId={selectedSubject?.id}
          groupName={selectedGroup?.name}
          subtype={selectedSubtype}
          onBack={handleBack}
          cart={cart}
          onCartToggle={toggleCartItem}
          onAssign={handleAssign}
          onTaskAdded={handleTaskAdded}
        />
      )}

      {step === 'bank' && (
        <TaskBankStep
          examType={selectedExam}
          subject={selectedSubject?.name}
          subjectId={selectedSubject?.id}
          tasks={currentTasks}
          isLoading={isLoading}
          onAddGroup={handleAddGroup}
          onBack={handleBack}
          onOpenList={handleOpenList}
        />
      )}

      {step === 'subject' && (
        <SubjectStep
          examType={selectedExam}
          subjects={subjects}
          onSelect={handleSelectSubject}
          onBack={skipExamStep ? undefined : handleBack}
        />
      )}

      {step === 'exam' && (
        <ExamStep examTypes={examTypes} onSelect={handleSelectExam} />
      )}
    </>
  );
};

export default TaskBank;