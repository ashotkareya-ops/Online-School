import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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

  const subjects = {
    oge: ['Математика', 'Информатика', 'Физика'],
    ege: [
      'Математика (профильный уровень)',
      'Математика (базовый уровень)',
      'Физика',
      'Информатика'
    ]
  };

  const toggleSubject = (subject) => {
    setFormData(prev => {
      const isSelected = prev.selectedSubjects.includes(subject);
      return {
        ...prev,
        selectedSubjects: isSelected
          ? prev.selectedSubjects.filter(s => s !== subject)
          : [...prev.selectedSubjects, subject]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await updateProfile({
      first_name: formData.firstName,
      last_name: formData.lastName,
      exam_type: formData.examType,
      subjects: formData.selectedSubjects,
    });

    setIsLoading(false);

    if (result.success) {
      onSave(formData);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal setup-modal">
        <h2 className="modal-title">Настройка профиля</h2>
        <p className="modal-subtitle">Выберите тип экзамена и предметы для подготовки</p>

        <form onSubmit={handleSubmit} className="modal-form">
          <input
            className="modal-input"
            placeholder="Имя"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          <input
            className="modal-input"
            placeholder="Фамилия"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />

          <div className="role-picker">
            <div
              className={`role-option ${formData.examType === 'oge' ? 'role-option--active' : ''}`}
              onClick={() => setFormData({ ...formData, examType: 'oge', selectedSubjects: [] })}
            >
              ОГЭ
            </div>
            <div
              className={`role-option ${formData.examType === 'ege' ? 'role-option--active' : ''}`}
              onClick={() => setFormData({ ...formData, examType: 'ege', selectedSubjects: [] })}
            >
              ЕГЭ
            </div>
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
            disabled={isLoading || formData.selectedSubjects.length === 0 || !formData.firstName || !formData.lastName || !formData.examType}
          >
            {isLoading ? 'Сохранение...' : `Сохранить и начать (${formData.selectedSubjects.length})`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupProfileModal;