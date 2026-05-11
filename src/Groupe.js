import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getTehilim } from './tehilimTextes';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

const isMobile = window.innerWidth < 600;
const PRENOMS_MULTIPLES = ['chalva', 'avraham'];

function PopupValidé({ couleur }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setTimeout(() => setPhase(1), 50);
    setTimeout(() => setPhase(2), 350);
    setTimeout(() => setPhase(3), 550);
    setTimeout(() => setPhase(4), 1500);
  }, []);

  const scales = [0, 1.3, 0.9, 1, 0];
  const scale = scales[phase];
  if (phase === 4) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, pointerEvents: 'none'
    }}>
      <div style={{
        width: '110px', height: '110px', borderRadius: '50%',
        background: couleur,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${scale})`,
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
      }}>
        <span style={{ fontSize: '3.5rem', color: 'white' }}>✓</span>
      </div>
    </div>
  );
}

function PopupTehilim({ nums, couleur, groupeId, onClose }) {
  const [textes, setTextes] = useState({});

  useEffect(() => {
    nums.forEach(num => {
      const avecFr = groupeId === 'tehilim' && num >= 31 && num <= 45;
      getTehilim(num, avecFr).then(t => {
        setTextes(prev => ({ ...prev, [num]: t }));
      });
    });
  }, [nums, groupeId]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '10px'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '16px', width: '100%', maxWidth: '650px',
        maxHeight: '90vh', overflowY: 'auto',
        boxSizing: 'border-box'
      }}>
        {nums.map(num => (
          <div key={num} style={{ marginBottom: '40px' }}>
            <h2 style={{
              color: couleur, textAlign: 'center',
              fontSize: 'clamp(1rem, 3vw, 1.3rem)',
              marginBottom: '12px'
            }}>
              פרק {num} — Chapitre {num}
            </h2>

            {/* Texte hébreu */}
            <div style={{
              direction: 'rtl', textAlign: 'right',
              fontSize: 'clamp(1.3rem, 5vw, 1.8rem)',
              lineHeight: '2', color: '#1a1a2e', padding: '12px',
              background: '#f8f8ff', borderRadius: '10px',
              fontFamily: 'Times New Roman, serif',
              wordBreak: 'break-word', boxSizing: 'border-box'
            }}>
              {textes[num]?.he || 'Chargement...'}
            </div>

            {/* Traduction française si disponible */}
            {textes[num]?.fr && (
              <div style={{
                marginTop: '12px',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                lineHeight: '1.8', color: '#333', padding: '12px',
                background: '#fffdf0', borderRadius: '10px',
                borderLeft: `4px solid ${couleur}`,
                boxSizing: 'border-box'
              }}>
                {textes[num].fr}
              </div>
            )}

            <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px solid #eee' }} />
          </div>
        ))}

        <button onClick={onClose} style={{
          padding: '14px', background: couleur,
          color: 'white', border: 'none', borderRadius: '8px',
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
  const [showValidé, setShowValidé] = useState(false);

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

  function prenomDejaUtilise(p) {
    if (PRENOMS_MULTIPLES.includes(p.trim().toLowerCase())) return false;
    return Object.values(chapitres).some(
      v => v.trim().toLowerCase() === p.trim().toLowerCase()
    );
  }

  async function confirmerAvecPrenom(p) {
    if (prenomDejaUtilise(p)) {
      alert(`Le prénom "${p}" est déjà pris ! Choisis un autre prénom.`);
      return;
    }

    const choix = Object.keys(cochés).filter(k => cochés[k]).map(Number).sort((a, b) => a - b);
    const ref = doc(db, 'lectures', docId);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data().chapitres : {};

    choix.forEach(num => { if (!data[num]) data[num] = p; });
    await setDoc(ref, { chapitres: data }, { merge: false });
    setPrenom('');
    setCochés({});
    setDemandePrenom(false);
    setPrenomTemp('');
    setShowValidé(true);
    setTimeout(() => setShowValidé(false), 2100);
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

  function ouvrirLecture(num) {
    const pritPar = chapitres[num];
    if (pritPar) {
      const sesChapitres = Object.keys(chapitres)
        .filter(k => chapitres[k].trim().toLowerCase() === pritPar.trim().toLowerCase())
        .map(Number)
        .sort((a, b) => a - b);
      setSelected(sesChapitres);
    } else {
      setSelected([num]);
    }
  }

  const pris = Object.keys(chapitres).length;
  const nbCochés = Object.values(cochés).filter(Boolean).length;

  return (
    <div style={{
      maxWidth: '800px', margin: '0 auto',
      padding: '12px', fontFamily: 'Arial',
      boxSizing: 'border-box', width: '100%'
    }}>

      <h1 style={{
        color: couleur, textAlign: 'center',
        marginBottom: '4px', fontSize: 'clamp(1rem, 4vw, 1.8rem)'
      }}>
        📖 {nom}
      </h1>
      <p style={{ textAlign: 'center', color: '#888', marginTop: 0, fontSize: '0.9rem' }}>
        {pris}/150 chapitres pris
      </p>

      <div style={{ background: '#eee', borderRadius: '10px', height: '10px', margin: '8px 0 16px' }}>
        <div style={{
          width: `${(pris / 150) * 100}%`,
          background: couleur, height: '10px',
          borderRadius: '10px', transition: 'width 0.3s'
        }} />
      </div>

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
            color: 'white', border: 'none', fontSize: '1rem',
            cursor: nbCochés > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold', whiteSpace: 'nowrap'
          }}
        >
          Prendre ({nbCochés})
        </button>
      </div>

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
                padding: '8px 6px', transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    onClick={() => ouvrirLecture(num)}
                    style={{
                      fontWeight: '900', color: couleur, cursor: 'pointer',
                      fontSize: 'clamp(0.8rem, 3vw, 0.95rem)',
                      textDecoration: 'underline', textDecorationThickness: '2px',
                      minWidth: '24px', flexShrink: 0
                    }}
                  >
                    {num}
                  </span>

                  <div
                    onClick={() => toggleCoché(num)}
                    style={{
                      width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                      border: `2px solid ${pritPar ? couleur : coché ? couleur : '#bbb'}`,
                      background: pritPar ? couleur : coché ? couleur : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: pritPar ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {(pritPar || coché) && (
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                    )}
                  </div>

                  <span style={{
                    fontSize: 'clamp(0.55rem, 2vw, 0.65rem)',
                    color: pritPar ? couleur : '#bbb',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', flex: 1
                  }}>
                    {pritPar || ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {showValidé && <PopupValidé couleur={couleur} />}

      {selected && (
        <PopupTehilim
          nums={selected}
          couleur={couleur}
          groupeId={groupeId}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}