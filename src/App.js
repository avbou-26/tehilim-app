import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Groupe from './Groupe';

function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#1a1a2e' }}>🕍 Tehilim</h1>
      <p style={{ fontSize: '1.2rem', color: '#555' }}>Choisissez votre groupe</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '40px' }}>
        <Link to="/tehilim" style={btnStyle('#4a90d9')}>
          📖 TEHILIM
        </Link>
        <Link to="/tehilim-david-haniel" style={btnStyle('#7b68ee')}>
          📖 Tehilim David Haniel
        </Link>
      </div>
    </div>
  );
}

const btnStyle = (color) => ({
  display: 'block',
  padding: '20px 40px',
  backgroundColor: color,
  color: 'white',
  borderRadius: '12px',
  textDecoration: 'none',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
});

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tehilim" element={<Groupe groupeId="tehilim" nom="TEHILIM" couleur="#4a90d9" />} />
        <Route path="/tehilim-david-haniel" element={<Groupe groupeId="tehilim-david-haniel" nom="Tehilim David Haniel" couleur="#7b68ee" />} />
      </Routes>
    </Router>
  );
}

export default App;
