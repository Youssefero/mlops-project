import React from 'react';
import { GiWateringCan } from 'react-icons/gi';
import HealthStatus from './HealthStatus';

function Header() {
  return (
    <div className="header">
      <div className="header-left">
        <h1>🌱 Smart Irrigation</h1>
        <p>Système de prédiction d'irrigation intelligent — MLOps</p>
      </div>
      <div className="header-right">
        <HealthStatus />
      </div>
    </div>
  );
}

export default Header;