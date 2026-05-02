import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

/* ── Real data from STUARD dataset (June 29 – Sep 13, 2023) ─────────────────── */
const TEMP_DATA = [
  {"day":"J1","temp":29.3,"max":41.2,"hum":46.1},{"day":"J4","temp":27.1,"max":37.5,"hum":58.5},
  {"day":"J7","temp":32.0,"max":41.4,"hum":42.9},{"day":"J10","temp":25.5,"max":34.2,"hum":51.7},
  {"day":"J13","temp":23.6,"max":30.1,"hum":56.3},{"day":"J16","temp":29.1,"max":38.1,"hum":58.0},
  {"day":"J19","temp":31.3,"max":42.0,"hum":51.1},{"day":"J22","temp":22.4,"max":32.4,"hum":63.9},
  {"day":"J25","temp":25.0,"max":37.2,"hum":56.5},{"day":"J28","temp":27.8,"max":38.7,"hum":60.2},
  {"day":"J31","temp":30.1,"max":41.5,"hum":55.8},{"day":"J34","temp":26.3,"max":35.9,"hum":58.1},
  {"day":"J37","temp":28.6,"max":39.1,"hum":58.2},{"day":"J40","temp":31.3,"max":42.1,"hum":44.3},
  {"day":"J43","temp":22.0,"max":32.9,"hum":75.0},{"day":"J46","temp":26.3,"max":37.5,"hum":58.9},
  {"day":"J49","temp":25.8,"max":38.7,"hum":60.2},{"day":"J52","temp":31.3,"max":42.0,"hum":44.3},
  {"day":"J55","temp":27.7,"max":39.4,"hum":51.9},{"day":"J58","temp":27.7,"max":39.4,"hum":51.9},
  {"day":"J61","temp":24.9,"max":36.2,"hum":58.1},{"day":"J64","temp":25.8,"max":38.7,"hum":55.3},
  {"day":"J67","temp":27.4,"max":38.1,"hum":58.0},{"day":"J70","temp":24.4,"max":36.6,"hum":57.2},
  {"day":"J73","temp":25.9,"max":38.7,"hum":55.3},{"day":"J76","temp":27.7,"max":39.4,"hum":51.9},
];

const SOIL_DATA = [
  {"day":"J1","L1":30.6,"L2":31.1,"L3":43.6},{"day":"J4","L1":26.3,"L2":30.3,"L3":48.6},
  {"day":"J7","L1":23.6,"L2":37.6,"L3":52.6},{"day":"J10","L1":22.8,"L2":30.1,"L3":43.6},
  {"day":"J13","L1":21.0,"L2":25.3,"L3":38.7},{"day":"J16","L1":29.6,"L2":44.2,"L3":28.6},
  {"day":"J19","L1":25.8,"L2":40.2,"L3":22.8},{"day":"J22","L1":30.6,"L2":36.1,"L3":20.8},
  {"day":"J25","L1":32.0,"L2":34.8,"L3":20.2},
];

const WATER_DATA = [
  {"week":"S1","L1":154, "L2":165, "L3":0},
  {"week":"S2","L1":2790,"L2":3321,"L3":2897},
  {"week":"S3","L1":5151,"L2":2897,"L3":2456},
  {"week":"S4","L1":8603,"L2":4856,"L3":2505},
  {"week":"S5","L1":4761,"L2":3215,"L3":1879},
  {"week":"S6","L1":4532,"L2":3193,"L3":1585},
  {"week":"S7","L1":4398,"L2":2468,"L3":965},
  {"week":"S8","L1":2897,"L2":1789,"L3":1003},
  {"week":"S9","L1":4994,"L2":3124,"L3":1807},
];

const GDD_DATA = [
  {"day":"J1","gdd":13.0},{"day":"J5","gdd":55.8},{"day":"J10","gdd":110.4},
  {"day":"J15","gdd":184.7},{"day":"J20","gdd":265.0},{"day":"J25","gdd":329.8},
  {"day":"J30","gdd":385.8},{"day":"J35","gdd":456.2},{"day":"J40","gdd":504.0},
  {"day":"J45","gdd":558.4},{"day":"J50","gdd":626.4},{"day":"J55","gdd":694.9},
  {"day":"J60","gdd":767.8},{"day":"J65","gdd":808.7},{"day":"J70","gdd":847.6},
  {"day":"J77","gdd":905.4},
];

/* ── Colors ────────────────────────────────────────────────────────────────── */
const C = {
  green: '#2e7d32', greenL: '#81c784', greenA: '#e8f5e9',
  blue:  '#1565c0', blueL:  '#64b5f6', blueA:  '#e3f2fd',
  teal:  '#00695c', tealL:  '#4db6ac', tealA:  '#e0f2f1',
  amber: '#e65100', amberL: '#ffb74d',
};

/* ── SVG Icons ─────────────────────────────────────────────────────────────── */
const IconTemp  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>;
const IconDrop  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IconSoil  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconPlant = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;

/* ── Custom Tooltip ────────────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#fff',border:'1px solid #ece9e2',borderRadius:8,padding:'8px 12px',fontSize:12,boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
      <div style={{fontWeight:600,marginBottom:6,color:'#333',fontSize:13}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color,display:'flex',justifyContent:'space-between',gap:12}}>
          <span>{p.name}</span><strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ── Water Level Bars ──────────────────────────────────────────────────────── */
function WaterLevels() {
  const totals = [
    { line: 'Ligne 1', val: 38280, max: 38280, cls: 'l1', pct: 100 },
    { line: 'Ligne 2', val: 25028, max: 38280, cls: 'l2', pct: Math.round(25028/38280*100) },
    { line: 'Ligne 3', val: 15094, max: 38280, cls: 'l3', pct: Math.round(15094/38280*100) },
  ];
  return (
    <div className="water-lines">
      {totals.map(t => (
        <div className="water-line-item" key={t.line}>
          <div className="water-line-header">
            <span className="water-line-name">{t.line}</span>
            <span className="water-line-val">{t.val.toLocaleString()} L total · {t.pct}%</span>
          </div>
          <div className="water-bar-track">
            <div className={`water-bar-fill ${t.cls}`} style={{width:`${t.pct}%`}} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Summary Stats ─────────────────────────────────────────────────────────── */
function SummaryStats() {
  const stats = [
    { label:'Température moy.',  val:'26.9°C',   sub:'min 10.1 / max 43.7',  color:'green',  icon:<IconTemp /> },
    { label:'Vol. total L1+L2+L3', val:'78.4 kL', sub:'38280 + 25028 + 15094 L', color:'blue', icon:<IconDrop /> },
    { label:'Humidité sol moy.', val:'25.8%',    sub:'Capteurs à 20 cm de profondeur', color:'teal',  icon:<IconSoil /> },
    { label:'GDD accumulé',      val:'905 °C',   sub:'Tbase = 10°C · 77 jours',       color:'amber', icon:<IconPlant /> },
  ];
  return (
    <div className="stat-grid mb-24">
      {stats.map(s => (
        <div className={`stat-card ${s.color}`} key={s.label}>
          <div className={`stat-icon ${s.color}`}>{s.icon}</div>
          <div className="stat-value">{s.val}</div>
          <div className="stat-label">{s.label}</div>
          <div className="stat-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────────────────── */
export default function DataDashboard() {
  const [soilTab, setSoilTab] = useState('humidity');

  return (
    <>
      <div className="page-header">
        <h1>Tableau de bord — Dataset STUARD</h1>
        <p>Capteurs IoT · Parcelle de tomates · 29 juin – 13 septembre 2023 · 76 jours de monitoring</p>
      </div>

      {/* KPI Cards */}
      <SummaryStats />

      {/* Row 1: Temperature + Water Levels */}
      <div className="grid-2 mb-20">

        {/* Temperature Chart */}
        <div className="card">
          <div className="card-title"><IconTemp /> Température & Humidité Air</div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={TEMP_DATA}>
              <defs>
                <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.amber}  stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={C.amber}  stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.blue}   stopOpacity={0.12}/>
                  <stop offset="95%" stopColor={C.blue}   stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="day" stroke="#a8a090" fontSize={11} interval={4} />
              <YAxis stroke="#a8a090" fontSize={11} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{fontSize:12}} />
              <ReferenceLine y={32} stroke="#f44336" strokeDasharray="4 3" strokeWidth={1} label={{value:'Tcutoff 32°C',position:'insideTopRight',fontSize:10,fill:'#f44336'}} />
              <Area type="monotone" dataKey="temp" name="Temp moy (°C)" stroke={C.amber} strokeWidth={2} fill="url(#gTemp)" dot={false} />
              <Area type="monotone" dataKey="hum"  name="Humidité (%)" stroke={C.blue}   strokeWidth={2} fill="url(#gHum)"  dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Water levels */}
        <div className="card">
          <div className="card-title"><IconDrop /> Volume cumulé par ligne de tomates</div>
          <div style={{marginBottom:20}}>
            <WaterLevels />
          </div>
          <div style={{fontSize:12,color:'#a8a090',padding:'10px 14px',background:'#f5f4f0',borderRadius:8}}>
            <strong>Note :</strong> La Ligne 1 a consommé 2.5× plus que la Ligne 3 sur la période de monitoring.
            Différences liées à la position, l'exposition solaire et l'état des capteurs.
          </div>
        </div>

      </div>

      {/* Row 2: Water weekly + Soil */}
      <div className="grid-2 mb-20">

        {/* Weekly water consumption */}
        <div className="card">
          <div className="card-title"><IconDrop /> Consommation d'eau hebdomadaire (L)</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={WATER_DATA} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
              <XAxis dataKey="week" stroke="#a8a090" fontSize={11} />
              <YAxis stroke="#a8a090" fontSize={11} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{fontSize:12}} />
              <Bar dataKey="L1" name="Ligne 1" fill={C.blue}  radius={[3,3,0,0]} />
              <Bar dataKey="L2" name="Ligne 2" fill={C.green} radius={[3,3,0,0]} />
              <Bar dataKey="L3" name="Ligne 3" fill={C.teal}  radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Soil data with tabs */}
        <div className="card">
          <div className="card-title"><IconSoil /> Données sol (capteurs à 20 cm)</div>
          <div className="tab-nav">
            <button className={`tab-btn ${soilTab==='humidity'?'active':''}`} onClick={()=>setSoilTab('humidity')}>Humidité sol</button>
            <button className={`tab-btn ${soilTab==='ec'     ?'active':''}`} onClick={()=>setSoilTab('ec')}>Conductivité EC</button>
          </div>
          {soilTab === 'humidity' && (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={SOIL_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="day" stroke="#a8a090" fontSize={11} />
                <YAxis stroke="#a8a090" fontSize={11} unit="%" />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{fontSize:12}} />
                <Line type="monotone" dataKey="L1" name="Ligne 1" stroke={C.blue}  strokeWidth={2} dot={{r:3}} />
                <Line type="monotone" dataKey="L2" name="Ligne 2" stroke={C.green} strokeWidth={2} dot={{r:3}} />
                <Line type="monotone" dataKey="L3" name="Ligne 3" stroke={C.teal}  strokeWidth={2} dot={{r:3}} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {soilTab === 'ec' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginTop:8}}>
              {[
                ['Ligne 1','335 µS/cm', C.blue,  'EC normal'],
                ['Ligne 2','365 µS/cm', C.green, 'EC normal'],
                ['Ligne 3','429 µS/cm', C.teal,  'EC légèrement élevé'],
              ].map(([name,val,color,note]) => (
                <div key={name} style={{background:'#f5f4f0',borderRadius:10,padding:16,textAlign:'center',border:`2px solid ${color}22`}}>
                  <div style={{fontSize:'0.75rem',color:'#a8a090',marginBottom:6,fontWeight:500}}>{name}</div>
                  <div style={{fontSize:'1.3rem',fontWeight:700,color,fontFamily:'DM Mono,monospace'}}>{val}</div>
                  <div style={{fontSize:'0.7rem',color:'#a8a090',marginTop:4}}>{note}</div>
                </div>
              ))}
              <div style={{gridColumn:'1/-1',fontSize:12,color:'#a8a090',padding:'8px 12px',background:'#f5f4f0',borderRadius:8,marginTop:4}}>
                EC normal : 200–800 µS/cm · Stress salin : &gt;2000 µS/cm · T_base = 10°C
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Row 3: GDD + CO2 */}
      <div className="grid-2 mb-20">

        {/* GDD cumulative */}
        <div className="card">
          <div className="card-title"><IconPlant /> GDD cumulé — Growing Degree Days</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={GDD_DATA}>
              <defs>
                <linearGradient id="gGDD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.green} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="day" stroke="#a8a090" fontSize={11} interval={3} />
              <YAxis stroke="#a8a090" fontSize={11} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="gdd" name="GDD (°C)" stroke={C.green} strokeWidth={2.5} fill="url(#gGDD)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{fontSize:12,color:'#a8a090',marginTop:10,padding:'8px 12px',background:'#e8f5e9',borderRadius:8}}>
            GDD final : <strong>905.4°C</strong> · T_base = 10°C · T_cutoff = 32°C · Croissance des tomates normale.
          </div>
        </div>

        {/* Dataset info panel */}
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,color:'#2e7d32'}}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Informations sur le dataset
          </div>

          {[
            ['Capteur environnemental', 'Milesight EM500 CO2', '10 964 mesures', C.amber],
            ['Capteurs sol (×3)',       'Milesight EM500 SMTC','32 668 mesures', C.green],
            ['Compteurs eau (×3)',      'Talkpool OY1310',     '32 649 mesures', C.blue ],
            ['Indicateurs agronomiques','Agriware Platform',   '77 jours',       C.teal ],
          ].map(([title, device, count, color]) => (
            <div key={title} style={{display:'flex',alignItems:'center',gap:14,padding:'10px 0',borderBottom:'1px solid #f0ede8'}}>
              <div style={{width:4,height:42,borderRadius:4,background:color,flexShrink:0}} />
              <div style={{flex:1}}>
                <div style={{fontSize:'0.85rem',fontWeight:600,color:'#1a1a18'}}>{title}</div>
                <div style={{fontSize:'0.75rem',color:'#a8a090'}}>{device}</div>
              </div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.78rem',color:color,fontWeight:600,background:`${color}15`,padding:'3px 8px',borderRadius:6}}>{count}</div>
            </div>
          ))}

          <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[
              ['Localisation','Lat 44.81° / Lon 10.27°'],
              ['Période','29 juin – 13 sept 2023'],
              ['Fréquence','~10 min (env/sol/eau)'],
              ['Profondeur sol','20 cm'],
            ].map(([k,v]) => (
              <div key={k} style={{background:'#f5f4f0',borderRadius:8,padding:'8px 12px'}}>
                <div style={{fontSize:'0.7rem',color:'#a8a090',fontWeight:500,marginBottom:2}}>{k}</div>
                <div style={{fontSize:'0.8rem',fontWeight:600,color:'#1a1a18'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
