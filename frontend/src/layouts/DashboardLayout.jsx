// src/layouts/DashboardLayout.jsx
import './DashboardLayout.css';

const DashboardLayout = () => {
  const assignments = [
    { id: 1, title: 'Линейные уравнения', deadline: '22.04' },
    { id: 2, title: 'Производные функций', deadline: '25.04' },
  ];

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-placeholder">Math</div>
        <nav>
          <ul>
            <li>Список курсов</li>
            <li className="active">Мои задания</li>
            <li>Профиль</li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>Доступные задания</h1>
        </header>
        <section className="assignments-grid">
          {assignments.map(task => (
            <div key={task.id} className="task-card">
              <h3>{task.title}</h3>
              <p>Срок до: {task.deadline}</p>
              <button className="btn-mint-outline">Выполнить</button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};