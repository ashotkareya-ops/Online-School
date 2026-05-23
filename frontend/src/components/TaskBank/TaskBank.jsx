import React, { useState, useEffect } from 'react';
import TaskList from './TaskList';
import './TaskBank.css';

const EXAM_LABELS = { oge: 'ОГЭ', ege: 'ЕГЭ' };
const EXAM_ICONS  = { oge: '📝', ege: '🎓' };
const EXAM_DESCS  = {
  oge: 'Основной государственный экзамен',
  ege: 'Единый государственный экзамен',
};

// ─── Данные заданий по предметам ─────────────────────────────────────────────
const TASK_DATA = {
  'Математика': [
    { id: 1, name: 'Простейшие текстовые задачи', subtypes: [
      { id: '1a', name: 'Путешествия', total: 6 },
      { id: '1b', name: 'Квартиры и садовые участки', total: 8 },
      { id: '1c', name: 'Связь, шины, печки', total: 13 },
    ]},
    { id: 2, name: 'Прикладная геометрия: площадь', subtypes: [
      { id: '2a', name: 'Планы комнат', total: 10 },
      { id: '2b', name: 'Участки и чертежи', total: 7 },
    ]},
    { id: 3, name: 'Прикладная геометрия: расстояния', subtypes: [
      { id: '3a', name: 'Карты и маршруты', total: 9 },
    ]},
    { id: 4, name: 'Выбор оптимального варианта', subtypes: [
      { id: '4a', name: 'Покупки и скидки', total: 11 },
      { id: '4b', name: 'Тарифы и услуги', total: 8 },
    ]},
    { id: 5, name: 'Числа и вычисления', subtypes: [
      { id: '5a', name: 'Целые числа', total: 15 },
      { id: '5b', name: 'Дроби и проценты', total: 12 },
    ]},
    { id: 6, name: 'Числовые неравенства', subtypes: [
      { id: '6a', name: 'Координатная прямая', total: 9 },
      { id: '6b', name: 'Модуль числа', total: 6 },
    ]},
    { id: 7, name: 'Уравнения, системы уравнений', subtypes: [
      { id: '7a', name: 'Линейные уравнения', total: 11 },
      { id: '7b', name: 'Квадратные уравнения', total: 8 },
      { id: '7c', name: 'Системы уравнений', total: 6 },
    ]},
  ],
  'Информатика': [
    { id: 1, name: 'Системы счисления', subtypes: [
      { id: 'i1a', name: 'Двоичная система', total: 14 },
      { id: 'i1b', name: 'Шестнадцатеричная', total: 9 },
    ]},
    { id: 2, name: 'Логические выражения', subtypes: [
      { id: 'i2a', name: 'Таблицы истинности', total: 12 },
      { id: 'i2b', name: 'Логические уравнения', total: 7 },
    ]},
    { id: 3, name: 'Алгоритмы', subtypes: [
      { id: 'i3a', name: 'Трассировка алгоритмов', total: 10 },
      { id: 'i3b', name: 'Рекурсия', total: 5 },
    ]},
  ],
  'Физика': [
    { id: 1, name: 'Механика', subtypes: [
      { id: 'f1a', name: 'Кинематика', total: 8 },
      { id: 'f1b', name: 'Динамика', total: 10 },
    ]},
    { id: 2, name: 'Термодинамика', subtypes: [
      { id: 'f2a', name: 'Газовые законы', total: 7 },
      { id: 'f2b', name: 'Теплообмен', total: 6 },
    ]},
  ],
};

const getTasksForSubject = (subject) => TASK_DATA[subject] || [];

// ─── Компонент: строка подтипа ────────────────────────────────────────────────
const SubtypeRow = ({ subtype, checked, count, onToggle, onCountChange, onOpenList }) => (
  <div className="tb-subtype-row">
    <div
      className={`tb-subtype-check ${checked ? 'checked' : ''}`}
      onClick={onToggle}
    />
    {/* Название — кликабельное, ведёт к списку заданий */}
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

// ─── Компонент: группа (аккордеон) ───────────────────────────────────────────
const TaskGroup = ({ group, isOpen, onToggle, checked, counts, onSubtypeToggle, onCountChange, onOpenList }) => (
  <div className={`tb-group ${isOpen ? 'open' : ''}`}>
    <div className="tb-group-header" onClick={onToggle}>
      <div className={`tb-group-num ${isOpen ? 'open' : ''}`}>{group.id}</div>
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
            count={counts[s.id] || Math.min(5, s.total)}
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
const TaskBankStep = ({ examType, subject, onBack, onOpenList }) => {
  const [openGroup, setOpenGroup] = useState(null);
  const [checked, setChecked]     = useState({});
  const [counts, setCounts]       = useState({});

  const tasks = getTasksForSubject(subject);

  const handleToggleGroup = (id) =>
    setOpenGroup(prev => prev === id ? null : id);

  const handleSubtypeToggle = (sid, total) => {
    setChecked(prev => {
      const next = { ...prev, [sid]: !prev[sid] };
      if (next[sid] && !counts[sid])
        setCounts(c => ({ ...c, [sid]: Math.min(5, total) }));
      return next;
    });
  };

  const handleCountChange = (sid, delta, total) => {
    setCounts(prev => ({
      ...prev,
      [sid]: Math.max(1, Math.min(total, (prev[sid] || 1) + delta)),
    }));
  };

  const checkedEntries = Object.entries(checked).filter(([, v]) => v);
  const totalTasks = checkedEntries.reduce((sum, [k]) => sum + (counts[k] || 1), 0);
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
        <button className="tb-add-btn">+ Добавить задание</button>
      </div>

      {tasks.length === 0 ? (
        <div className="tb-empty">
          <div className="tb-empty__icon">📋</div>
          <p className="tb-empty__text">Задания пока не добавлены</p>
          <p className="tb-empty__hint">Нажмите «Добавить задание», чтобы создать первое</p>
        </div>
      ) : (
        <>
          <div className="tb-groups">
            {tasks.map(group => (
              <TaskGroup
                key={group.id}
                group={group}
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
              Выбрано:{' '}
              <strong style={{ color: '#00a86b' }}>
                {totalTypes} {totalTypes === 1 ? 'тип' : 'типа'} · {totalTasks} заданий
              </strong>
            </span>
            <button className="tb-assign-btn" disabled={totalTasks === 0}>
              Задать ученикам →
            </button>
          </div>
        </>
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

// ─── Корневой компонент с роутингом по шагам ─────────────────────────────────
const TaskBank = ({ user }) => {
  // Шаги: 'exam' | 'subject' | 'bank' | 'list'
  const [step, setStep]                 = useState('exam');
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedGroup, setSelectedGroup]     = useState(null);   // { id, name }
  const [selectedSubtype, setSelectedSubtype] = useState(null);   // { id, name, total }

  const examTypes   = user?.exam_type || [];
  const allSubjects = user?.subjects  || [];
  const skipExamStep = examTypes.length === 1;

  useEffect(() => {
    if (skipExamStep && examTypes.length === 1) {
      setSelectedExam(examTypes[0]);
      setStep('subject');
    }
  }, []);

  const getSubjectsForExam = (exam) => {
    if (exam === 'ege')
      return allSubjects.filter(s => s.includes('профильный') || s.includes('базовый') || !['Математика','Информатика','Физика','Химия','Биология'].includes(s));
    if (exam === 'oge')
      return allSubjects.filter(s => !s.includes('профильный') && !s.includes('базовый'));
    return allSubjects;
  };

  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    setStep('subject');
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setStep('bank');
  };

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

  if (step === 'list') {
    return (
      <TaskList
        examType={selectedExam}
        subject={selectedSubject}
        groupName={selectedGroup?.name}
        subtypeName={selectedSubtype?.name}
        onBack={handleBack}
      />
    );
  }

  if (step === 'bank') {
    return (
      <TaskBankStep
        examType={selectedExam}
        subject={selectedSubject}
        onBack={handleBack}
        onOpenList={handleOpenList}
      />
    );
  }

  if (step === 'subject') {
    return (
      <SubjectStep
        examType={selectedExam}
        subjects={getSubjectsForExam(selectedExam)}
        onSelect={handleSelectSubject}
        onBack={skipExamStep ? undefined : handleBack}
      />
    );
  }

  return <ExamStep examTypes={examTypes} onSelect={handleSelectExam} />;
};

export default TaskBank;