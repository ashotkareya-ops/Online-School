import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../components/SetupProfileModal/SetupProfileModal.css';

const SetupProfileModal = ({ onSave }) => {
  const { updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    examType: '',
    selectedSubjects: []
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const subjects = useMemo(() => ({
    oge: ['Математика', 'Информатика', 'Физика'],
    ege: [
      'Математика (профильный уровень)',
      'Математика (базовый уровень)',
      'Физика',
      'Информатика'
    ]
  }), []);

  const toggleSubject = (subject) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subject)
        ? prev.selectedSubjects.filter(s => s !== subject)
        : [...prev.selectedSubjects, subject]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();

    if (firstName.length < 2 || lastName.length < 2) {
      setError('Имя и фамилия должны быть не менее 2 символов');
      return;
    }

    setIsLoading(true);
    const result = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      exam_type: formData.examType.toLowerCase(),
      subjects: formData.selectedSubjects,
    });
    setIsLoading(false);

    if (result.success) {
      onSave(formData);
    } else {
      setError(result.message);
    }
  };

  const isFormValid =
    formData.firstName.trim().length >= 2 &&
    formData.lastName.trim().length >= 2 &&
    formData.examType !== '' &&
    formData.selectedSubjects.length > 0;

    
  return (
    <div className="modal-overlay">
      <div className="modal setup-modal">
        <h2 className="modal-title">Настройка профиля</h2>
        <p className="modal-subtitle">Выберите тип экзамена и предметы для подготовки</p>

        <form onSubmit={handleSubmit} className="modal-form">
          <input
            className="modal-input"
            placeholder="Имя"
            maxLength={50}
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          <input
            className="modal-input"
            placeholder="Фамилия"
            maxLength={50}
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />

          <div className="role-picker">
            {['oge', 'ege'].map(type => (
              <div
                key={type}
                className={`role-option ${formData.examType === type ? 'role-option--active' : ''}`}
                onClick={() => setFormData({ ...formData, examType: type, selectedSubjects: [] })}
              >
                {type === 'oge' ? 'ОГЭ' : 'ЕГЭ'}
              </div>
            ))}
          </div>

          {formData.examType && (
            <div className="subjects-selection">
              <p className="label">Выберите один или несколько предметов:</p>
              <div className="subjects-grid">
                {subjects[formData.examType].map(sub => (
                  <div
                    key={sub}
                    className={`subject-chip ${formData.selectedSubjects.includes(sub) ? 'selected' : ''}`}
                    onClick={() => toggleSubject(sub)}
                  >
                    {sub}
                    {formData.selectedSubjects.includes(sub) && <span className="check-icon">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <span className="modal-error">{error}</span>}

          <button
            type="submit"
            className="modal-submit"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? 'Сохранение...' : `Сохранить и начать (${formData.selectedSubjects.length})`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupProfileModal;