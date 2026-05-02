import React, { useState, useEffect } from 'react';
import axios from 'axios';

function HealthStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get('http://localhost:8000/health');
        setStatus('online');
      } catch {
        setStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const config = {
    online: { label: 'API En ligne', className: 'online' },
    offline: { label: 'API Hors ligne', className: 'offline' },
    checking: { label: 'Vérification...', className: 'checking' },
  };

  const { label, className } = config[status];

  return (
    <div className={`health-badge ${className}`}>
      <div className="dot" />
      {label}
    </div>
  );
}

export default HealthStatus;