import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import logo from '../assets/logo.png';

/* ── SVG Icons (custom, no external lib needed) ─────────────────────────────── */

const IconDrop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
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
          <div className="brand-icon">
            <img src={logo} alt="SmartIrrig Logo" className="logo-img" />
          </div>
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
