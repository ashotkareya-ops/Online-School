import React, { useState, useEffect } from 'react';
import TaskList from './TaskList';
import './TaskBank.css';

const EXAM_LABELS = { oge: 'ОГЭ', ege: 'ЕГЭ' };
const EXAM_ICONS  = { oge: '📝', ege: '🎓' };
const EXAM_DESCS  = {
  oge: 'Основной государственный экзамен',
  ege: 'Единый государственный экзамен',
};

// ─── Модалка добавления группы и подтипов ─────────────────────────────────────
const AddGroupModal = ({ onClose, onSave, subject }) => {
  const [name, setName] = useState('');
  const [subtypes, setSubtypes] = useState([{ name: '' }]);
  const [error, setError] = useState('');

  const handleAddSubtype = () => {
    setSubtypes([...subtypes, { name: '' }]);
  };

  const handleRemoveSubtype = (index) => {
    if (subtypes.length > 1) {
      setSubtypes(subtypes.filter((_, i) => i !== index));
    }
  };

  const handleSubtypeChange = (index, value) => {
    const newSubtypes = [...subtypes];
    newSubtypes[index].name = value;
    setSubtypes(newSubtypes);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Введите название задания (темы)');
      return;
    }

    const validSubtypes = subtypes.filter(s => s.name.trim() !== '');
    if (validSubtypes.length === 0) {
      setError('Добавьте хотя бы один подтип');
      return;
    }

    setError('');
    
    const newGroup = {
      name: name.trim(),
      subtypes: validSubtypes.map(sub => ({
        name: sub.name.trim(),
        total: 0 // Пока нет загруженных заданий
      }))
    };

    onSave(newGroup);
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
          <button className="tb-modal__save" onClick={handleSave}>Добавить задание</button>
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
const TaskBankStep = ({ examType, subject, tasks, isLoading, onAddGroup, onBack, onOpenList }) => {
  const [openGroup, setOpenGroup] = useState(null);
  const [checked, setChecked]     = useState({});
  const [counts, setCounts]       = useState({});
  const [showAddModal, setShowAddModal] = useState(false);

  const handleToggleGroup = (id) =>
    setOpenGroup(prev => prev === id ? null : id);

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

  const handleSaveNewGroup = (newGroup) => {
    onAddGroup(newGroup);
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
        <button key={subject} className="tb-subject-btn" onClick={() => onSelect(subject)}>
          {subject}
          <span className="tb-subject-btn__arrow">→</span>
        </button>
      ))}
    </div>
  </div>
);

// ─── Корневой компонент ───────────────────────────────────────────────────────
const TaskBank = ({ user }) => {
  const [step, setStep]           = useState('exam');
  const [selectedExam, setSelectedExam]       = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedGroup, setSelectedGroup]     = useState(null);
  const [selectedSubtype, setSelectedSubtype] = useState(null);

  const [taskData, setTaskData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState([]);

  // ВОССТАНОВЛЕННЫЕ ПЕРЕМЕННЫЕ ИЗ PROPS USER
  const examTypes    = user?.exam_type || [];
  const allSubjects  = user?.subjects  || [];
  const skipExamStep = examTypes.length === 1;

  useEffect(() => {
    if (skipExamStep && examTypes.length === 1) {
      setSelectedExam(examTypes[0]);
      setStep('subject');
    }
  }, [skipExamStep, examTypes]);

  // ЗАГРУЗКА ДАННЫХ ИЗ БД (GET)
  useEffect(() => {
    if (step === 'bank' && selectedSubject) {
      const fetchGroups = async () => {
        setIsLoading(true);
        try {
          // TODO: Подключить API
          // const response = await axios.get(`/api/task-groups/?subject=${selectedSubject}&exam=${selectedExam}`);
          // setTaskData(prev => ({ ...prev, [selectedSubject]: response.data }));
          
          // Заглушка, чтобы не падало, пока API нет:
          if (!taskData[selectedSubject]) {
             setTaskData(prev => ({ ...prev, [selectedSubject]: [] }));
          }
        } catch (error) {
          console.error("Ошибка при загрузке тем:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchGroups();
    }
  }, [step, selectedSubject, selectedExam, taskData]);

  const handleAddGroup = async (newGroupData) => {
    try {
      // TODO: Отправка на сервер
      // const response = await axios.post('/api/task-groups/', newGroupData);
      // const savedGroup = response.data;
      
      // Временная генерация ID для фронтенда:
      const savedGroup = { 
        ...newGroupData, 
        id: Date.now(),
        subtypes: newGroupData.subtypes.map((sub, i) => ({
          ...sub,
          id: `new_${Date.now()}_${i}`
        }))
      }; 

      setTaskData(prev => ({
        ...prev,
        [selectedSubject]: [...(prev[selectedSubject] || []), savedGroup]
      }));
    } catch (error) {
      console.error("Ошибка при создании темы:", error);
      alert("Не удалось создать тему.");
    }
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

  const getSubjectsForExam = (exam) => {
    if (exam === 'ege')
      return allSubjects.filter(s => s.includes('профильный') || s.includes('базовый') || !['Математика','Информатика','Физика','Химия','Биология'].includes(s));
    if (exam === 'oge')
      return allSubjects.filter(s => !s.includes('профильный') && !s.includes('базовый'));
    return allSubjects;
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

  const currentTasks = taskData[selectedSubject] || [];

  return (
    <>
      {step === 'list' && (
        <TaskList
          examType={selectedExam}
          subject={selectedSubject}
          groupName={selectedGroup?.name}
          subtypeName={selectedSubtype?.name}
          onBack={handleBack}
          cart={cart}
          onCartToggle={toggleCartItem}
          onAssign={handleAssign}
        />
      )}

      {step === 'bank' && (
        <TaskBankStep
          examType={selectedExam}
          subject={selectedSubject}
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
          subjects={getSubjectsForExam(selectedExam)}
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