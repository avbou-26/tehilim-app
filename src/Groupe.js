import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getTehilim } from './tehilimTextes';


function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}
function PopupTehilim({ num, couleur, onClose }) {
  const [texte, setTexte] = useState({ he: '', fr: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTehilim(num).then((t) => {
      setTexte(t);
      setLoading(false);
    });
  }, [num]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '650px',
        width: '92%',
        maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        
        <h2 style={{ color: couleur, textAlign: 'center' }}>
          פרק {num} — Chapitre {num}
        </h2>

        {loading ? (
          <p style={{ textAlign: 'center' }}>Chargement...</p>
        ) : (
          <>
            
            {/* Hébreu */}
            <div
              style={{
                direction: 'rtl',
                textAlign: 'right',
                fontSize: '22px',
                lineHeight: '2',
                marginBottom: '25px'
              }}
              dangerouslySetInnerHTML={{ __html: texte.he }}
            />

            {/* Traduction */}
            <div
              style={{
                lineHeight: '1.8',
                fontSize: '16px'
              }}
              dangerouslySetInnerHTML={{ __html: texte.fr }}
            />

          </>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            padding: '10px 25px',
            background: couleur,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Fermer
        </button>

      </div>
    </div>
  );
}
export default function Groupe({ groupeId, nom, couleur }) {
  const [chapitres, setChapitres] = useState({});
  const [prenom, setPrenom] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const docId = `${groupeId}_${getTodayKey()}`;

  useEffect(() => {
    const ref = doc(db, 'lectures', docId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setChapitres(snap.data().chapitres || {});
      } else {
        setChapitres({});
      }
      setLoading(false);
    });
    return () => unsub();
  }, [docId]);

  async function prendreChapitre(num) {
    if (!prenom.trim()) {
      alert('Entre ton prénom d\'abord !');
      return;
    }
    if (chapitres[num]) return;

    const ref = doc(db, 'lectures', docId);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data().chapitres : {};
    if (data[num]) return;

    data[num] = prenom.trim();
    await setDoc(ref, { chapitres: data }, { merge: true });
  }

  const pris = Object.keys(chapitres).length;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: couleur, textAlign: 'center' }}>📖 {nom}</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>
        {pris}/150 chapitres pris
      </p>

      {/* Barre de progression */}
      <div style={{ background: '#eee', borderRadius: '10px', height: '12px', margin: '10px 0 20px' }}>
        <div style={{
          width: `${(pris/150)*100}%`,
          background: couleur,
          height: '12px',
          borderRadius: '10px',
          transition: 'width 0.3s'
        }} />
      </div>

      {/* Prénom */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <input
          type="text"
          placeholder="Entre ton prénom"
          value={prenom}
          onChange={e => setPrenom(e.target.value)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: `2px solid ${couleur}`,
            fontSize: '1rem',
            width: '250px'
          }}
        />
      </div>

      {/* Grille des chapitres */}
      {loading ? (
        <p style={{ textAlign: 'center' }}>Chargement...</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
          gap: '8px'
        }}>
          {Array.from({ length: 150 }, (_, i) => i + 1).map(num => {
            const prit = chapitres[num];
            return (
              <div
                key={num}
                onClick={() => {
                  if (!prit) prendreChapitre(num);
                  else setSelected(num);
                }}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: prit ? 'default' : 'pointer',
                  background: prit ? couleur : '#f0f0f0',
                  color: prit ? 'white' : '#333',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  border: `2px solid ${prit ? couleur : '#ddd'}`,
                  transition: 'all 0.2s'
                }}
              >
                <div>{num}</div>
                {prit && <div style={{ fontSize: '0.65rem', marginTop: '2px' }}>{prit}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Popup lecture */}
      {selected && (
  <PopupTehilim
    num={selected}
    couleur={couleur}
    onClose={() => setSelected(null)}
  />
 )}
    </div>
  );
}