import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import PredictionPage from './components/PredictionPage';
import DataDashboard from './components/DataDashboard';
import Footer from './components/Footer';

function App() {
  const [page, setPage]       = useState('predict');
  const [result, setResult]   = useState(null);
  const [history, setHistory] = useState([]);

  const handleResult = (value) => {
    setResult(value);
    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    setHistory(prev => [...prev, { time, value }]);
  };

  return (
    <div className="app">
      <Navbar currentPage={page} onNavigate={setPage} />

      <div className="page-content">
        {page === 'predict' && (
          <PredictionPage
            result={result}
            history={history}
            onResult={handleResult}
          />
        )}
        {page === 'data' && <DataDashboard />}
      </div>

      <Footer />
    </div>
  );
}

export default App;