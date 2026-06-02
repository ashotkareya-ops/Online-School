import React, { useState, useEffect, useMemo } from 'react';
import "./Schedule.css";

const API_URL = import.meta.env.VITE_API_URL || '';

const WEEKDAYS_SHORT = ['п', 'в', 'с', 'ч', 'п', 'с', 'в'];
const MONTHS_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];
const LESSON_TYPE_LABELS = {
  individual: 'Индивидуальное',
  group:      'Групповое',
  trial:      'Пробное',
  
};

const authFetch = (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    },
  });
};

const startOfMonth = (year, month) => new Date(year, month, 1);
const daysInMonth  = (year, month) => new Date(year, month + 1, 0).getDate();
const weekdayMon0  = (date) => (date.getDay() + 6) % 7;
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatTime = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

// ─── Окно списка занятий на день ─────────────────────────────
const DayLessonsModal = ({ date, lessons, onClose, onAddLesson, onCancelLesson }) => {
  
  // Проверяем 24 часа исключительно для визуального стиля кнопки
  const checkCanCancel = (startsAt) => {
    const now = new Date();
    const lessonTime = new Date(startsAt);
    const diffHours = (lessonTime - now) / (1000 * 60 * 60);
    return diffHours >= 24;
  };

  return (
    <div className="sch-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sch-modal">
        <button className="sch-modal__close" onClick={onClose}>✕</button>
        <h3 className="sch-modal__name" style={{ marginBottom: '16px', textAlign: 'left' }}>
          {date ? date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'Занятия'}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '250px', overflowY: 'auto' }}>
          {lessons.length === 0 ? (
            <p style={{ color: '#8e8e93', textAlign: 'center', margin: '20px 0', fontSize: '15px' }}>
              Нет запланированных мероприятий
            </p>
          ) : (
            lessons.map((l, i) => {
              // Узнаем, можно ли отменить урок (для визуала)
              const allowedToCancel = checkCanCancel(l.starts_at);
              
              return (
                <div 
                  key={l.id || i} 
                  style={{ 
                    border: '1px solid #e5e5ea', 
                    borderRadius: '10px', 
                    padding: '12px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{l.title}</div>
                    <div style={{ fontSize: '13px', color: '#8e8e93', marginTop: '2px' }}>
                      {formatTime(l.starts_at)} • {LESSON_TYPE_LABELS[l.lesson_type] || 'Занятие'}
                    </div>
                  </div>
                  <button 
                    className="sch-btn sch-btn--danger sch-btn--sm"
                    style={{ 
                      opacity: allowedToCancel ? 1 : 0.4, // Если нельзя отменить - делаем полупрозрачной
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); 
                      // Клик сработает в любом случае, а функция handleCancelClick (в главном компоненте)
                      // уже сама решит: показать alert или окно подтверждения
                      onCancelLesson(l.id, l.starts_at);
                    }}
                  >
                    Отменить
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="sch-modal__footer" style={{ justifyContent: 'space-between' }}>
          <button className="sch-btn sch-btn--ghost" onClick={onClose}>Закрыть</button>
          <button className="sch-btn sch-btn--primary" onClick={onAddLesson}>+ Занятие</button>
        </div>
      </div>
    </div>
  );
};
// ─── Окно создания занятия ───────────────────────────────────
const AddLessonModal = ({ onClose, onSave, date }) => {
  const [form, setForm] = useState({
    title: '',
    lesson_type: 'individual',
    starts_at: date ? `${date.toISOString().slice(0,10)}T10:00` : '',
  });

  return (
    <div className="sch-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sch-modal">
        <button className="sch-modal__close" onClick={onClose}>✕</button>
        <h3 className="sch-modal__name" style={{marginBottom: '20px', textAlign: 'left'}}>Новое занятие</h3>
        
        <div className="sch-form">
          <label className="sch-form__label">Ученик или Название</label>
          <input
            className="sch-form__input"
            placeholder="Например: Леван или ММА"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />

          <label className="sch-form__label">Тип занятия</label>
          <select
            className="sch-form__input"
            value={form.lesson_type}
            onChange={e => setForm(f => ({ ...f, lesson_type: e.target.value }))}
          >
            {Object.entries(LESSON_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <label className="sch-form__label">Дата и время</label>
          <input
            className="sch-form__input"
            type="datetime-local"
            value={form.starts_at}
            onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
          />
        </div>

        <div className="sch-modal__footer">
          <button className="sch-btn sch-btn--ghost" onClick={onClose}>Отмена</button>
          <button className="sch-btn sch-btn--primary" onClick={() => onSave(form)}>Добавить</button>
        </div>
      </div>
    </div>
  );
};

// ─── Сетка календаря ─────────────────────────────────────────
const CalendarGrid = ({ year, month, lessons, onDayClick }) => {
  const today = new Date();
  const firstDay = startOfMonth(year, month);
  const totalDays = daysInMonth(year, month);
  const offset = weekdayMon0(firstDay);

  const lessonsByDay = useMemo(() => {
    const map = {};
    lessons.forEach(l => {
      if (!l.starts_at) return;
      const d = new Date(l.starts_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate();
        if (!map[key]) map[key] = [];
        map[key].push(l);
      }
    });
    return map;
  }, [lessons, year, month]);

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="sch-month-block">
      <h3 className="sch-month-title">{MONTHS_RU[month]}</h3>
      
      <div className="sch-weekday-header">
        {WEEKDAYS_SHORT.map((wd, i) => (
          <div key={i} className={`sch-weekday-label ${i >= 5 ? 'sch-weekday-label--weekend' : ''}`}>
            {wd}
          </div>
        ))}
      </div>

      {weeks.map((week, wIdx) => (
        <div key={wIdx} className="sch-week-row">
          {week.map((day, dIdx) => {
            if (!day) return <div key={`empty-${wIdx}-${dIdx}`} className="sch-day-col" />;

            const cellDate = new Date(year, month, day);
            const isToday = isSameDay(cellDate, today);
            const isWeekend = dIdx >= 5;
            const dayLessons = lessonsByDay[day] || [];

            return (
              <div
                key={day}
                className={`sch-day-col ${isWeekend ? 'sch-day-col--weekend' : ''}`}
                onClick={() => onDayClick(cellDate)}
              >
                <div className={`sch-day-num ${isToday ? 'sch-day-num--today' : ''}`}>
                  {day}
                </div>
                <div className="sch-day-chips">
                  {dayLessons.map((l, i) => {
                    const hex = l.color || '#007aff';
                    const r = parseInt(hex.slice(1, 3), 16) || 0;
                    const g = parseInt(hex.slice(3, 5), 16) || 122;
                    const b = parseInt(hex.slice(5, 7), 16) || 255;
                    
                    return (
                      <div 
                        key={l.id || i} 
                        className="sch-chip" 
                        style={{ 
                          backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
                          color: `rgba(${r}, ${g}, ${b}, 1)` 
                        }}
                      >
                        <span className="sch-chip__title">{l.title}</span>
                        <span className="sch-chip__time">{formatTime(l.starts_at)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ─── Главный компонент ───────────────────────────────────────
const Schedule = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Новое состояние: хранит ID урока, который мы хотим удалить, чтобы показать наше окно
  const [lessonToCancel, setLessonToCancel] = useState(null); 

  const selectedDayLessons = useMemo(() => {
    if (!selectedDate) return [];
    return lessons.filter(l => l.starts_at && isSameDay(new Date(l.starts_at), selectedDate));
  }, [lessons, selectedDate]);

  useEffect(() => {
    const fetchLessons = async () => {
      setIsLoading(true);
      try {
        const from = new Date(year, month, 1).toISOString();
        const to = new Date(year, month + 1, 0).toISOString();
        
        const response = await authFetch(`${API_URL}/api/lessons/?from=${from}&to=${to}`);
        if (response.ok) {
          const data = await response.json();
          setLessons(data);
        }
      } catch (error) {
        console.error("Ошибка при загрузке расписания:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLessons();
  }, [year, month]);

  const handleCreateLesson = async (formData) => {
    try {
      const response = await authFetch(`${API_URL}/api/lessons/`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const newLesson = await response.json();
        setLessons(prev => [...prev, newLesson]); 
        setShowAddModal(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Ошибка при создании занятия");
      }
    } catch (error) {
      console.error("Ошибка при создании занятия:", error);
    }
  };

  // 1. Эта функция просто проверяет время и открывает НАШУ модалку
  const handleCancelClick = (id, startsAt) => {
    const now = new Date();
    const lessonTime = new Date(startsAt);
    const diffHours = (lessonTime - now) / (1000 * 60 * 60);

    if (diffHours < 24) {
      alert("Извините, вы не можете отменить это мероприятие (осталось менее 24 часов).");
      return; 
    }

    // Если всё ок — показываем наше красивое React-окно (вместо системного confirm)
    setLessonToCancel(id);
  };

  // 2. А эта функция срабатывает, если в модалке нажали "Да, отменить"
  const confirmCancelLesson = async () => {
    if (!lessonToCancel) return;

    try {
      const response = await authFetch(`${API_URL}/api/lessons/${lessonToCancel}/`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setLessons(prev => prev.filter(l => l.id !== lessonToCancel));
        setLessonToCancel(null); // Закрываем модалку подтверждения
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Не удалось отменить занятие");
      }
    } catch (error) {
      console.error("Ошибка при отмене занятия:", error);
    }
  };

  return (
    <div className="sch-root">
      <div className="sch-header">
        <div>
          <h2 className="sch-header__title">Расписание</h2>
          <p className="sch-header__sub">{year} год</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
           <button className="sch-btn sch-btn--ghost" onClick={() => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }}>‹ Назад</button>
           <button className="sch-btn sch-btn--ghost" onClick={() => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }}>Вперед ›</button>
           <button className="sch-btn sch-btn--primary" onClick={() => { setSelectedDate(null); setShowAddModal(true); }}>
             + Занятие
           </button>
        </div>
      </div>

      <div className="sch-scroll">
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8e8e93', fontSize: '15px' }}>
            Загрузка расписания...
          </div>
        ) : (
          <CalendarGrid
            year={year}
            month={month}
            lessons={lessons}
            onDayClick={(date) => { setSelectedDate(date); setShowDayModal(true); }}
          />
        )}
      </div>

      {showDayModal && (
        <DayLessonsModal
          date={selectedDate}
          lessons={selectedDayLessons}
          onClose={() => setShowDayModal(false)}
          onAddLesson={() => { setShowDayModal(false); setShowAddModal(true); }}
          onCancelLesson={handleCancelClick}
        />
      )}

      {showAddModal && (
        <AddLessonModal
          date={selectedDate}
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateLesson}
        />
      )}

      {/* ─── НАШЕ СОБСТВЕННОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ ─── */}
      {lessonToCancel && (
        <div className="sch-overlay" onClick={e => e.target === e.currentTarget && setLessonToCancel(null)}>
          <div className="sch-modal" style={{ maxWidth: '320px', textAlign: 'center' }}>
            <h3 className="sch-modal__name" style={{marginBottom: '10px'}}>Отменить занятие?</h3>
            <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '24px' }}>
              Вы уверены? Это действие нельзя будет отменить.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="sch-btn sch-btn--ghost" onClick={() => setLessonToCancel(null)}>Нет, оставить</button>
              <button className="sch-btn sch-btn--danger" onClick={confirmCancelLesson}>Да, отменить</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Schedule;