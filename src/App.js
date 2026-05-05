import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Groupe from './Groupe';

function Home() {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 20px', fontFamily: 'Arial',
      background: 'linear-gradient(135deg, #f5f7fa, #e8ecf1)',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '2.5rem', color: '#1a1a2e', marginBottom: '8px' }}>🕍 Tehilim</h1>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '50px' }}>Choisissez votre groupe</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
        <Link to="/tehilim" style={{
          display: 'block', padding: '24px 48px',
          backgroundColor: '#4a90d9', color: 'white',
          borderRadius: '14px', textDecoration: 'none',
          fontSize: '1.1rem', fontWeight: 'bold',
          boxShadow: '0 4px 20px rgba(74,144,217,0.4)'
        }}>
          📖 David Haniel Ben Esther 1
        </Link>
        <Link to="/tehilim-david-haniel" style={{
          display: 'block', padding: '24px 48px',
          backgroundColor: '#7b68ee', color: 'white',
          borderRadius: '14px', textDecoration: 'none',
          fontSize: '1.1rem', fontWeight: 'bold',
          boxShadow: '0 4px 20px rgba(123,104,238,0.4)'
        }}>
          📖 David Haniel Ben Esther 2
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tehilim" element={<Groupe groupeId="tehilim" nom="David Haniel Ben Esther 1" couleur="#4a90d9" />} />
        <Route path="/tehilim-david-haniel" element={<Groupe groupeId="tehilim-david-haniel" nom="David Haniel Ben Esther 2" couleur="#7b68ee" />} />
      </Routes>
    </Router>
  );
}

export default App;