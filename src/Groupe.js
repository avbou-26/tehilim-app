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
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, padding: '10px' // Z-index augmenté pour passer devant tout
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '20px', maxWidth: '650px', width: '100%',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h2 style={{ color: couleur, textAlign: 'center', fontFamily: 'Arial', fontSize: '1.2rem' }}>
          פרק {num} — Chapitre {num}
        </h2>
        {loading ? (
          <p style={{ textAlign: 'center' }}>Chargement...</p>
        ) : (
          <div style={{
            direction: 'rtl', textAlign: 'right',
            fontSize: '1.3rem', lineHeight: '2', // Texte un peu plus gros pour mobile
            color: '#1a1a2e', padding: '15px',
            background: '#f8f8ff', borderRadius: '10px',
            fontFamily: 'Times New Roman, serif'
          }}>
            {texte.he}
          </div>
        )}
        <button onClick={onClose} style={{
          marginTop: '16px', padding: '15px 40px', // Plus grand pour le clic
          background: couleur, color: 'white',
          border: 'none', borderRadius: '8px',
          fontSize: '1rem', cursor: 'pointer',
          display: 'block', margin: '16px auto 0',
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px', fontFamily: 'Arial', boxSizing: 'border-box' }}>

      {/* Header */}
      <h1 style={{ color: couleur, textAlign: 'center', marginBottom: '4px', fontSize: 'clamp(1.3rem, 6vw, 2rem)' }}>
        📖 {nom}
      </h1>
      <p style={{ textAlign: 'center', color: '#888', marginTop: 0, fontSize: '0.95rem' }}>
        {pris}/150 chapitres pris
      </p>

      {/* Barre de progression */}
      <div style={{ background: '#eee', borderRadius: '10px', height: '12px', margin: '12px 0 24px' }}>
        <div style={{
          width: `${(pris / 150) * 100}%`,
          background: couleur, height: '100%',
          borderRadius: '10px', transition: 'width 0.3s'
        }} />
      </div>

      {/* Prénom + bouton prendre */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="✍️ Prénom"
          value={prenom}
          onChange={e => setPrenom(e.target.value)}
          style={{
            padding: '14px', borderRadius: '10px',
            border: `2px solid ${couleur}`, fontSize: '1rem',
            flex: '2', minWidth: '0' // minWidth 0 permet de ne pas casser le flex sur mobile
          }}
        />
        <button
          onClick={valider}
          disabled={nbCochés === 0}
          style={{
            padding: '14px', borderRadius: '10px',
            background: nbCochés > 0 ? couleur : '#ccc',
            color: 'white', border: 'none',
            fontSize: '1rem', cursor: nbCochés > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold', flex: '1'
          }}
        >
          {nbCochés > 0 ? `Prendre (${nbCochés})` : 'Prendre'}
        </button>
      </div>

      {/* Grille responsive */}
      {loading ? (
        <p style={{ textAlign: 'center' }}>Chargement...</p>
      ) : (
        <div style={{
          display: 'grid',
          // 2 colonnes sur mini écrans, 3 sur mobiles moyens, 5 sur ordi
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
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
                padding: '10px 6px',
                display: 'flex', flexDirection: 'column', gap: '4px' // Organisation verticale pour mobile
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Numéro */}
                  <span
                    onClick={() => setSelected(num)}
                    style={{
                      fontWeight: '900', color: couleur, cursor: 'pointer',
                      fontSize: '1.1rem', textDecoration: 'underline',
                      padding: '2px 4px'
                    }}
                  >
                    {num}
                  </span>

                  {/* Case à cocher plus grande pour le doigt */}
                  <div
                    onClick={() => toggleCoché(num)}
                    style={{
                      width: '24px', height: '24px',
                      borderRadius: '6px',
                      border: `2px solid ${pritPar ? couleur : coché ? couleur : '#bbb'}`,
                      background: pritPar ? couleur : coché ? couleur : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: pritPar ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {(pritPar || coché) && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
                  </div>
                </div>

                {/* Prénom en dessous du numéro pour plus de place */}
                <div style={{
                  fontSize: '0.75rem',
                  color: pritPar ? '#333' : '#bbb',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', textAlign: 'center',
                  fontWeight: pritPar ? 'bold' : 'normal',
                  minHeight: '1rem'
                }}>
                  {pritPar || ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Popups (inchangées mais avec z-index haut) */}
      {demandePrenom && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 4000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px',
            padding: '25px', maxWidth: '320px', width: '100%',
            textAlign: 'center'
          }}>
            <h3 style={{ color: couleur, marginTop: 0 }}>✍️ Ton prénom</h3>
            <input
              autoFocus
              type="text"
              placeholder="Entre ton prénom"
              value={prenomTemp}
              onChange={e => setPrenomTemp(e.target.value)}
              style={{
                padding: '12px', borderRadius: '8px',
                border: `2px solid ${couleur}`, fontSize: '1rem',
                width: '100%', boxSizing: 'border-box', marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDemandePrenom(false)} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px' }}>Annuler</button>
              <button onClick={() => prenomTemp.trim() && confirmerAvecPrenom(prenomTemp.trim())} style={{ flex: 1, padding: '12px', background: couleur, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {selected && <PopupTehilim num={selected} couleur={couleur} onClose={() => setSelected(null)} />}
    </div>
  );
}