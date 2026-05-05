import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getTehilim } from './tehilimTextes';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function PopupTehilim({ num, couleur, onClose }) {
  const [texte, setTexte] = useState({ he: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTehilim(num).then((t) => {
      setTexte(t);
      setLoading(false);
    });
  }, [num]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '10px'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px',
        padding: '20px', maxWidth: '500px', width: '95%',
        maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ color: couleur, textAlign: 'center', fontSize: '1.4rem', margin: '0 0 15px' }}>
          פרק {num} — Chapitre {num}
        </h2>
        {loading ? (
          <p style={{ textAlign: 'center' }}>Chargement...</p>
        ) : (
          <div style={{
            direction: 'rtl', textAlign: 'right',
            fontSize: '1.4rem', lineHeight: '1.8',
            color: '#1a1a2e', padding: '15px',
            background: '#f8f8ff', borderRadius: '12px',
            fontFamily: 'serif'
          }}>
            {texte.he}
          </div>
        )}
        <button onClick={onClose} style={{
          marginTop: '20px', padding: '16px',
          background: couleur, color: 'white',
          border: 'none', borderRadius: '12px',
          fontSize: '1.1rem', cursor: 'pointer',
          width: '100%', fontWeight: 'bold'
        }}>
          ✕ Fermer
        </button>
      </div>
    </div>
  );
}

export default function Groupe({ groupeId, nom, couleur }) {
  const [chapitres, setChapitres] = useState({});
  const [prenom, setPrenom] = useState('');
  const [prenomTemp, setPrenomTemp] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cochés, setCochés] = useState({});
  const [demandePrenom, setDemandePrenom] = useState(false);

  const docId = `${groupeId}_${getTodayKey()}`;

  useEffect(() => {
    const ref = doc(db, 'lectures', docId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setChapitres(snap.data().chapitres || {});
      else setChapitres({});
      setLoading(false);
    });
    return () => unsub();
  }, [docId]);

  function toggleCoché(num) {
    if (chapitres[num]) return;
    setCochés(prev => ({ ...prev, [num]: !prev[num] }));
  }

  async function confirmerAvecPrenom(p) {
    const choix = Object.keys(cochés).filter(k => cochés[k]);
    const ref = doc(db, 'lectures', docId);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data().chapitres : {};
    choix.forEach(num => { if (!data[num]) data[num] = p; });
    await setDoc(ref, { chapitres: data }, { merge: false });
    setPrenom(p);
    setCochés({});
    setDemandePrenom(false);
    setPrenomTemp('');
  }

  async function valider() {
    const choix = Object.keys(cochés).filter(k => cochés[k]);
    if (choix.length === 0) return;
    if (!prenom.trim()) {
      setDemandePrenom(true);
      return;
    }
    await confirmerAvecPrenom(prenom.trim());
  }

  const pris = Object.keys(chapitres).length;
  const nbCochés = Object.values(cochés).filter(Boolean).length;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '15px', boxSizing: 'border-box' }}>

      {/* Header compact pour laisser de la place aux boutons */}
      <h1 style={{ color: couleur, textAlign: 'center', marginBottom: '5px', fontSize: '1.6rem' }}>
        📖 {nom}
      </h1>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <span style={{ color: '#666', fontSize: '0.9rem' }}>{pris} / 150 chapitres lus</span>
        <div style={{ background: '#eee', borderRadius: '10px', height: '10px', marginTop: '5px' }}>
          <div style={{ width: `${(pris / 150) * 100}%`, background: couleur, height: '100%', borderRadius: '10px', transition: '0.5s' }} />
        </div>
      </div>

      {/* Zone d'action fixe ou bien visible sur mobile */}
      <div style={{ 
        display: 'flex', gap: '10px', marginBottom: '20px', 
        position: 'sticky', top: '10px', zIndex: 100,
        background: 'white', padding: '10px 0' 
      }}>
        <input
          type="text"
          placeholder="Ton Prénom"
          value={prenom}
          onChange={e => setPrenom(e.target.value)}
          style={{
            padding: '15px', borderRadius: '12px', border: `2px solid ${couleur}`,
            fontSize: '1rem', flex: 1, minWidth: '0'
          }}
        />
        <button
          onClick={valider}
          disabled={nbCochés === 0}
          style={{
            padding: '15px 20px', borderRadius: '12px',
            background: nbCochés > 0 ? couleur : '#ccc',
            color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1rem'
          }}
        >
          Prendre {nbCochés > 0 && `(${nbCochés})`}
        </button>
      </div>

      {/* Grille : on force 3 colonnes sur petit mobile, 4-5 sur plus grand */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
        gap: '10px'
      }}>
        {Array.from({ length: 150 }, (_, i) => i + 1).map(num => {
          const pritPar = chapitres[num];
          const coché = cochés[num];

          return (
            <div 
              key={num}
              onClick={() => !pritPar && toggleCoché(num)}
              style={{
                borderRadius: '12px',
                border: `2px solid ${pritPar ? couleur : coché ? couleur : '#eee'}`,
                background: pritPar ? `${couleur}15` : coché ? `${couleur}30` : '#fdfdfd',
                padding: '12px 5px',
                textAlign: 'center',
                position: 'relative',
                minHeight: '60px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center'
              }}
            >
              <div 
                onClick={(e) => { e.stopPropagation(); setSelected(num); }}
                style={{ fontWeight: 'bold', color: couleur, fontSize: '1.2rem', textDecoration: 'underline' }}
              >
                {num}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pritPar ? pritPar : coché ? 'SÉLECT.' : ''}
              </div>
              {coché && !pritPar && (
                 <div style={{ position: 'absolute', top: '5px', right: '5px', color: couleur, fontSize: '0.8rem' }}>✓</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Popup prénom */}
      {demandePrenom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '20px', width: '80%', maxWidth: '300px' }}>
            <h3 style={{ marginTop: 0, textAlign: 'center' }}>Ton prénom ?</h3>
            <input 
              autoFocus 
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ccc' }}
              value={prenomTemp}
              onChange={e => setPrenomTemp(e.target.value)}
            />
            <button 
              onClick={() => prenomTemp.trim() && confirmerAvecPrenom(prenomTemp.trim())}
              style={{ width: '100%', padding: '12px', background: couleur, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
            >
              Valider
            </button>
          </div>
        </div>
      )}

      {selected && <PopupTehilim num={selected} couleur={couleur} onClose={() => setSelected(null)} />}
    </div>
  );
}