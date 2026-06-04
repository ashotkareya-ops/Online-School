import React, { useState } from 'react';

const Homework = () => {
  const [activeSubject, setActiveSubject] = useState('Все');
  // Пример данных
  const homeworkData = [
    { id: 1, title: 'Реакция на события в JS', subject: 'Программирование', status: 'todo' },
    { id: 2, title: 'Квадратные уравнения', subject: 'Математика', status: 'review' },
    { id: 3, title: 'Работа', subject: 'Программирование', status: 'review' },
    { id: 4, title: 'Тригонометрия: синусы', subject: 'Математика', status: 'todo' },
  ];



  
  // Фильтрация
  const filtered = activeSubject === 'Все'
    ? homeworkData
    : homeworkData.filter(h => h.subject === activeSubject);

  const todoTasks = filtered.filter(h => h.status === 'todo');
  const reviewTasks = filtered.filter(h => h.status === 'review');

  return (
    <div className="main-container">
      {/* 1. Прямоугольники статистики */}
      <div className="stats-container">


        <div className="stat-card todo">
          <span className="stat-label">Нужно сделать</span>
          <span className="stat-value">{todoTasks.length}</span>
        </div>
        <div className="stat-card review">
          <span className="stat-label">На проверке</span>
          <span className="stat-value">{reviewTasks.length}</span>
        </div>
      </div>

      {/* 2. Вкладки предметов */}
      <div className="tabs-header">
        {['Все', 'Математика', 'Программирование'].map(subject => (
          <button
            key={subject}
            className={`tab-button ${activeSubject === subject ? 'active' : ''}`}
            onClick={() => setActiveSubject(subject)}
          >
            {subject}
          </button>
        ))}
      </div>




      {/* 3. Колонки */}
      <div className="homework-grid">
        <div className="homework-column">
          <h3>К выполнению</h3>
          {todoTasks.map(hw => (
            <div key={hw.id} className="hw-card">{hw.title}</div>
          ))}
        </div>

        <div className="homework-column">
          <h3>Отправленные</h3>
          {reviewTasks.map(hw => (
            <div key={hw.id} className="hw-card">{hw.title}</div>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default Homework;