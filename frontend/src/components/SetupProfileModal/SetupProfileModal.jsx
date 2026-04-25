import React, { useState, useMemo } from 'react';
import './SetupProfileModal.css';

const SetupProfileModal = ({ onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    examType: '',
    selectedSubjects: [],
    teacherCode: ''
  });

  // Список предметов выносим в useMemo, чтобы не пересоздавать при каждом рендере
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
    // Безопасное переключение предметов
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
    
    // БЕЗОПАСНОСТЬ: Валидация перед отправкой
    const cleanFirstName = formData.firstName.trim();
    const cleanLastName = formData.lastName.trim();
    const cleanTeacherCode = formData.teacherCode.trim().toUpperCase();

    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      alert("Имя и фамилия слишком короткие");
      return;
    }

    if (formData.selectedSubjects.length === 0) {
      alert("Выберите хотя бы один предмет");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Подготовка безопасного объекта для Django
      const finalData = {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        examType: formData.examType,
        selectedSubjects: formData.selectedSubjects,
        teacherCode: cleanTeacherCode || null
      };

      await onSave(finalData);
    } catch (error) {
      console.error("Ошибка сохранения профиля:", error);
      alert("Произошла ошибка при сохранении. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Проверка валидности формы для активации кнопки
  const isFormValid = 
    formData.firstName.trim().length >= 2 && 
    formData.lastName.trim().length >= 2 && 
    formData.examType !== '' &&
    formData.selectedSubjects.length > 0 &&
    !isSubmitting;

  return (
    <div className="modal-overlay">
      <div className="modal setup-modal">
        <h2 className="modal-title">Настройка профиля</h2>
        <p className="modal-subtitle">Заполните данные для начала обучения</p>

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
            <button
              type="button"
              className={`role-option ${formData.examType === 'oge' ? 'role-option--active' : ''}`}
              onClick={() => setFormData({ ...formData, examType: 'oge', selectedSubjects: [] })}
            >
              ОГЭ
            </button>
            <button
              type="button"
              className={`role-option ${formData.examType === 'ege' ? 'role-option--active' : ''}`}
              onClick={() => setFormData({ ...formData, examType: 'ege', selectedSubjects: [] })}
            >
              ЕГЭ
            </button>
          </div>

          {formData.examType && (
            <div className="subjects-selection">
              <p className="label">Выберите предметы:</p>
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

          <input
            className="modal-input teacher-code-input"
            placeholder="Код учителя (если есть)"
            maxLength={12}
            value={formData.teacherCode}
            onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value })}
            style={{ marginTop: '15px' }}
          />

          <button 
            type="submit" 
            className="modal-submit"
            disabled={!isFormValid}
          >
            {isSubmitting ? "Сохранение..." : `Сохранить и начать (${formData.selectedSubjects.length})`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupProfileModal;