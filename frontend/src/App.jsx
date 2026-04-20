import Navbar from './components/Navbar';
import React from 'react';
import './App.css';
import WaveLayout from './components/WaveLayout';
import AuthModal from './components/AuthModal';
import { useState } from 'react';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <Navbar onAuthClick={() => setIsModalOpen(true)} />
      <WaveLayout>
      </WaveLayout>

      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

export default App;