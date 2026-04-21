import React, { useState } from 'react';
import Navbar from './components/Navbar';
import WaveLayout from './components/WaveLayout';
import AuthModal from './components/AuthModal';
import './App.css';


function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  
  return (

    <div className="app-wrapper">
      <div className="background-decor" />
      <div className="page-content">
        <Navbar onAuthClick={() => setIsModalOpen(true)} />

        <WaveLayout>
        </WaveLayout>
      </div>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default App;
