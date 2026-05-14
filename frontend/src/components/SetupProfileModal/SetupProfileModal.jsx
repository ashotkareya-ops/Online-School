import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import './SetupProfileModal.css';

const SUBJECTS = {
  oge: ['Математика', 'Информатика', 'Физика', 'Химия', 'Биология'],
  ege: [
    'Математика (профильный)',
    'Математика (базовый)',
    'Физика',
    'Информатика',
    'Химия',
    'Биология',
  ],
};

const EXAM_LABELS = { oge: 'ОГЭ', ege: 'ЕГЭ' };

// ─── Форма ученика ────────────────────────────────────────────────────────────
const StudentForm = ({ onSave }) => {
  const { updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    examType: '',
    subjects: [],
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableSubjects = formData.examType ? SUBJECTS[formData.examType] : [];

  const toggleSubject = (sub) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(sub)
        ? prev.subjects.filter(s => s !== sub)
        : [...prev.subjects, sub],
    }));
  };

  const isValid =
    formData.firstName.trim().length >= 2 &&
    formData.lastName.trim().length >= 2 &&
    formData.examType !== '' &&
    formData.subjects.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await updateProfile({
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      exam_type: [formData.examType],
      subjects: formData.subjects,
    });
    setIsLoading(false);
    if (result.success) {
      onSave();
    } else {
      setError(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <input
        className="modal-input"
        placeholder="Имя"
        maxLength={50}
        required
        value={formData.firstName}
        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
      />
      <input
        className="modal-input"
        placeholder="Фамилия"
        maxLength={50}
        required
        value={formData.lastName}
        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
      />

      <p className="label">Тип экзамена:</p>
      <div className="role-picker">
        {['oge', 'ege'].map(type => (
          <div
            key={type}
            className={`role-option ${formData.examType === type ? 'role-option--active' : ''}`}
            onClick={() => setFormData({ ...formData, examType: type, subjects: [] })}
          >
            {EXAM_LABELS[type]}
          </div>
        ))}
      </div>

      {formData.examType && (
        <div className="subjects-selection">
          <p className="label">Предметы:</p>
          <div className="subjects-grid">
            {availableSubjects.map(sub => (
              <div
                key={sub}
                className={`subject-chip ${formData.subjects.includes(sub) ? 'selected' : ''}`}
                onClick={() => toggleSubject(sub)}
              >
                {sub}
                {formData.subjects.includes(sub) && <span className="check-icon">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <span className="modal-error">{error}</span>}

      <button
        type="submit"
        className="modal-submit"
        disabled={isLoading || !isValid}
      >
        {isLoading ? 'Сохранение...' : `Сохранить и начать (${formData.subjects.length})`}
      </button>
    </form>
  );
};

// ─── Форма учителя ────────────────────────────────────────────────────────────
const TeacherForm = ({ onSave }) => {
  const { updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    examTypes: [],
    subjects: [],
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableSubjects = useMemo(() => {
    if (formData.examTypes.length === 0) return [];
    const subs = new Set();
    formData.examTypes.forEach(t => SUBJECTS[t]?.forEach(s => subs.add(s)));
    return [...subs];
  }, [formData.examTypes]);

  const toggleExamType = (type) => {
    setFormData(prev => {
      const newTypes = prev.examTypes.includes(type)
        ? prev.examTypes.filter(t => t !== type)
        : [...prev.examTypes, type];
      const newAvailable = new Set();
      newTypes.forEach(t => SUBJECTS[t]?.forEach(s => newAvailable.add(s)));
      return {
        ...prev,
        examTypes: newTypes,
        subjects: prev.subjects.filter(s => newAvailable.has(s)),
      };
    });
  };

  const toggleSubject = (sub) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(sub)
        ? prev.subjects.filter(s => s !== sub)
        : [...prev.subjects, sub],
    }));
  };

  const isValid =
    formData.firstName.trim().length >= 2 &&
    formData.lastName.trim().length >= 2 &&
    formData.examTypes.length > 0 &&
    formData.subjects.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await updateProfile({
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      exam_type: formData.examTypes,
      subjects: formData.subjects,
    });
    setIsLoading(false);
    if (result.success) {
      onSave();
    } else {
      setError(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <input
        className="modal-input"
        placeholder="Имя"
        maxLength={50}
        required
        value={formData.firstName}
        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
      />
      <input
        className="modal-input"
        placeholder="Фамилия"
        maxLength={50}
        required
        value={formData.lastName}
        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
      />

      <p className="label">Какие экзамены преподаёте? (можно оба)</p>
      <div className="role-picker">
        {['oge', 'ege'].map(type => (
          <div
            key={type}
            className={`role-option ${formData.examTypes.includes(type) ? 'role-option--active' : ''}`}
            onClick={() => toggleExamType(type)}
          >
            {EXAM_LABELS[type]}
            {formData.examTypes.includes(type) && <span className="check-icon"> ✓</span>}
          </div>
        ))}
      </div>

      {availableSubjects.length > 0 && (
        <div className="subjects-selection">
          <p className="label">Предметы которые преподаёте:</p>
          <div className="subjects-grid">
            {availableSubjects.map(sub => (
              <div
                key={sub}
                className={`subject-chip ${formData.subjects.includes(sub) ? 'selected' : ''}`}
                onClick={() => toggleSubject(sub)}
              >
                {sub}
                {formData.subjects.includes(sub) && <span className="check-icon">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <span className="modal-error">{error}</span>}

      <button
        type="submit"
        className="modal-submit"
        disabled={isLoading || !isValid}
      >
        {isLoading ? 'Сохранение...' : `Сохранить (${formData.subjects.length} предм.)`}
      </button>
    </form>
  );
};

// ─── Главный компонент ────────────────────────────────────────────────────────
const SetupProfileModal = ({ onSave }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="modal-overlay">
      <div className="modal setup-modal">
        <h2 className="modal-title">
          {isTeacher ? 'Настройка профиля преподавателя' : 'Настройка профиля'}
        </h2>
        <p className="modal-subtitle">
          {isTeacher
            ? 'Укажите ваши данные и предметы которые вы преподаёте'
            : 'Выберите тип экзамена и предметы для подготовки'}
        </p>

        {isTeacher
          ? <TeacherForm onSave={onSave} />
          : <StudentForm onSave={onSave} />
        }
      </div>
    </div>
  );
};

export default SetupProfileModal;