import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar/Navbar';
import WaveLayout from '../layouts/WaveLayout';
import AuthModal from '../components/Auth/AuthModal';

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="app-wrapper">
      <div className="background-decor" />
      <div className="page-content">
        <Navbar onAuthClick={() => setIsModalOpen(true)} />

        <WaveLayout>
          <section className="hero">
            <h1 className="hero-title">Математика<br />становится проще</h1>
            <p className="hero-subtitle">
              Интерактивные задания, живой фидбек и личный кабинет для учеников и преподавателей.
            </p>
            <button
              className="hero-cta btn-mint-gradient"
              onClick={() => setIsModalOpen(true)}
            >
              Начать бесплатно
            </button>
          </section>
        </WaveLayout>
      </div>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Home;