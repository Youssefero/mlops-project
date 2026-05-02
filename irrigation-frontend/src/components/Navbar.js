import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

/* ── SVG Icons (custom, no external lib needed) ─────────────────────────────── */
const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const IconDrop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconSensor = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M6.3 6.3a8 8 0 0 0 0 11.4"/>
    <path d="M17.7 6.3a8 8 0 0 1 0 11.4"/>
    <path d="M3.5 3.5a13 13 0 0 0 0 17"/>
    <path d="M20.5 3.5a13 13 0 0 1 0 17"/>
  </svg>
);

/* ── Logo Icon ─────────────────────────────────────────────────────────────── */
const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    <path d="M9 12c0 1.657 1.343 3 3 3"/>
    <circle cx="12" cy="15" r="1" fill="white"/>
  </svg>
);

/* ── Health Status ─────────────────────────────────────────────────────────── */
function HealthPill() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const check = async () => {
      try { await axios.get(`${API_URL}/health`); setStatus('online'); }
      catch { setStatus('offline'); }
    };
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, []);

  const labels = { online: 'API En ligne', offline: 'API Hors ligne', checking: 'Connexion...' };

  return (
    <div className={`health-pill ${status}`}>
      <div className="health-dot" />
      {labels[status]}
    </div>
  );
}

/* ── Navbar ────────────────────────────────────────────────────────────────── */
export default function Navbar({ currentPage, onNavigate }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-icon"><LogoIcon /></div>
          <div>
            <div className="brand-name">SmartIrrig</div>
            <div className="brand-sub">MLOps · STUARD Dataset</div>
          </div>
        </div>

        {/* Links */}
        <div className="navbar-links">
          <button
            className={`nav-link ${currentPage === 'predict' ? 'active' : ''}`}
            onClick={() => onNavigate('predict')}
          >
            <IconDrop />
            <span>Prédiction</span>
          </button>

          <button
            className={`nav-link ${currentPage === 'data' ? 'active' : ''}`}
            onClick={() => onNavigate('data')}
          >
            <IconChart />
            <span>Données</span>
          </button>

          <HealthPill />
        </div>
      </div>
    </nav>
  );
}
