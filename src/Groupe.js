import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getTehilim } from './tehilimTextes';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

const isMobile = window.innerWidth < 600;

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
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '10px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '16px', width: '100%', maxWidth: '650px',
        maxHeight: '90vh', overflowY: 'auto',
        boxSizing: 'border-box'
      }}>
        <h2 style={{
          color: couleur, textAlign: 'center',
          fontFamily: 'Arial', fontSize: 'clamp(1rem, 3vw, 1.2rem)',
          margin: '0 0 12px 0'
        }}>
          פרק {num} — Chapitre {num}
        </h2>
        {loading ? (
          <p style={{ textAlign: 'center' }}>Chargement...</p>
        ) : (
          <div style={{
            direction: 'rtl', textAlign: 'right',
            fontSize: 'clamp(1.3rem, 5vw, 1.8rem)',
            lineHeight: '2',
            color: '#1a1a2e', padding: '12px',
            background: '#f8f8ff', borderRadius: '10px',
            fontFamily: 'Times New Roman, serif',
            wordBreak: 'break-word',
            boxSizing: 'border-box'
          }}>
            {texte.he}
          </div>
        )}
        <button onClick={onClose} style={{
          marginTop: '14px', padding: '12px',
          background: couleur, color: 'white',
          border: 'none', borderRadius: '8px',
          fontSize: '1rem', cursor: 'pointer',
          width: '100%', boxSizing: 'border-box'
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
    if (choix.length === 0) { alert('Coche au moins un chapitre !'); return; }
    if (!prenom.trim()) {
      setDemandePrenom(true);
      return;
    }
    await confirmerAvecPrenom(prenom.trim());
  }

  const pris = Object.keys(chapitres).length;
  const nbCochés = Object.values(cochés).filter(Boolean).length;

  return (
    <div style={{
      maxWidth: '800px', margin: '0 auto',
      padding: '12px', fontFamily: 'Arial',
      boxSizing: 'border-box', width: '100%'
    }}>

      {/* Header */}
      <h1 style={{
        color: couleur, textAlign: 'center',
        marginBottom: '4px',
        fontSize: 'clamp(1rem, 4vw, 1.8rem)'
      }}>
        📖 {nom}
      </h1>
      <p style={{ textAlign: 'center', color: '#888', marginTop: 0, fontSize: '0.9rem' }}>
        {pris}/150 chapitres pris
      </p>

      {/* Barre de progression */}
      <div style={{ background: '#eee', borderRadius: '10px', height: '10px', margin: '8px 0 16px' }}>
        <div style={{
          width: `${(pris / 150) * 100}%`,
          background: couleur, height: '10px',
          borderRadius: '10px', transition: 'width 0.3s'
        }} />
      </div>

      {/* Prénom + bouton prendre */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        gap: '8px', marginBottom: '16px', flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="✍️ Ton prénom"
          value={prenom}
          onChange={e => setPrenom(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: '8px',
            border: `2px solid ${couleur}`, fontSize: '1rem',
            flex: '1', minWidth: '140px', maxWidth: '220px',
            boxSizing: 'border-box'
          }}
        />
        <button
          onClick={valider}
          disabled={nbCochés === 0}
          style={{
            padding: '10px 18px', borderRadius: '8px',
            background: nbCochés > 0 ? couleur : '#ccc',
            color: 'white', border: 'none',
            fontSize: '1rem',
            cursor: nbCochés > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold', whiteSpace: 'nowrap'
          }}
        >
          Prendre ({nbCochés})
        </button>
      </div>

      {/* Grille : 3 colonnes mobile, 5 colonnes PC */}
      {loading ? (
        <p style={{ textAlign: 'center' }}>Chargement...</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
          gap: '8px'
        }}>
          {Array.from({ length: 150 }, (_, i) => i + 1).map(num => {
            const pritPar = chapitres[num];
            const coché = cochés[num];

            return (
              <div key={num} style={{
                borderRadius: '10px',
                border: `2px solid ${pritPar ? couleur : coché ? couleur : '#e0e0e0'}`,
                background: pritPar ? `${couleur}22` : coché ? `${couleur}11` : 'white',
                padding: '8px 6px',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                  {/* Numéro cliquable */}
                  <span
                    onClick={() => setSelected(num)}
                    style={{
                      fontWeight: '900',
                      color: couleur,
                      cursor: 'pointer',
                      fontSize: 'clamp(0.8rem, 3vw, 0.95rem)',
                      textDecoration: 'underline',
                      textDecorationThickness: '2px',
                      minWidth: '24px',
                      flexShrink: 0
                    }}
                  >
                    {num}
                  </span>

                  {/* Case à cocher */}
                  <div
                    onClick={() => toggleCoché(num)}
                    style={{
                      width: '20px', height: '20px',
                      borderRadius: '4px', flexShrink: 0,
                      border: `2px solid ${pritPar ? couleur : coché ? couleur : '#bbb'}`,
                      background: pritPar ? couleur : coché ? couleur : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: pritPar ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {(pritPar || coché) && (
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                    )}
                  </div>

                  {/* Prénom */}
                  <span style={{
                    fontSize: 'clamp(0.55rem, 2vw, 0.65rem)',
                    color: pritPar ? couleur : '#bbb',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {pritPar || ''}
                  </span>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Popup demande prénom */}
      {demandePrenom && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '20px', boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px',
            padding: '24px', maxWidth: '350px', width: '100%',
            textAlign: 'center', boxSizing: 'border-box'
          }}>
            <h3 style={{ color: couleur, marginBottom: '16px' }}>✍️ Ton prénom</h3>
            <input
              autoFocus
              type="text"
              placeholder="Entre ton prénom"
              value={prenomTemp}
              onChange={e => setPrenomTemp(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && prenomTemp.trim()) confirmerAvecPrenom(prenomTemp.trim()); }}
              style={{
                padding: '12px', borderRadius: '8px',
                border: `2px solid ${couleur}`, fontSize: '1rem',
                width: '100%', boxSizing: 'border-box', marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setDemandePrenom(false); setPrenomTemp(''); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px',
                  background: '#eee', border: 'none',
                  fontSize: '1rem', cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => { if (prenomTemp.trim()) confirmerAvecPrenom(prenomTemp.trim()); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px',
                  background: couleur, color: 'white', border: 'none',
                  fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                Valider ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup tehilim */}
      {selected && (
        <PopupTehilim num={selected} couleur={couleur} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}