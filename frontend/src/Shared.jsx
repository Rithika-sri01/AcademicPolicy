import React from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

// ── SHARED CHART OPTIONS ──────────────────────────────────────────────────────
const gridColor  = 'rgba(180,150,220,.15)';
const tickColor  = '#A090B8';
const fontFamily = 'Nunito';

export const DONUT_COLORS = {
  high:     { bg: '#FADADD', border: '#D4607A' },
  moderate: { bg: '#FFF0C0', border: '#C28A00' },
  low:      { bg: '#C8F0E0', border: '#2E9B6A' },
};

export function RiskDonut({ high, moderate, low }) {
  return (
    <Doughnut
      data={{
        labels: ['High Risk','Moderate','Low Risk'],
        datasets:[{
          data: [high, moderate, low],
          backgroundColor: [DONUT_COLORS.high.bg, DONUT_COLORS.moderate.bg, DONUT_COLORS.low.bg],
          borderColor:     [DONUT_COLORS.high.border, DONUT_COLORS.moderate.border, DONUT_COLORS.low.border],
          borderWidth: 2.5,
        }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position:'right', labels:{ color:tickColor, font:{family:fontFamily,weight:'700',size:11}, padding:14 }},
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.toLocaleString()}` }},
        },
      }}
    />
  );
}

export function BarChart({ labels, datasets, maxY }) {
  const PAL = ['#C4A8E8','#88CFBA','#F2A8BE','#88B8E0','#F0D888','#F0B890'];
  return (
    <Bar
      data={{
        labels,
        datasets: datasets.map((d,i) => ({
          label: d.label || '',
          data:  d.data,
          backgroundColor: (d.color || PAL[i % PAL.length]) + 'CC',
          borderColor:      d.color || PAL[i % PAL.length],
          borderRadius: 10, borderSkipped: false,
        })),
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: datasets.length > 1, labels:{ color:tickColor, font:{family:fontFamily,weight:'700',size:11}}}},
        scales: {
          x: { grid:{ color:gridColor }, ticks:{ color:tickColor, font:{family:fontFamily} }},
          y: { grid:{ color:gridColor }, ticks:{ color:tickColor, font:{family:fontFamily} }, beginAtZero:true, ...(maxY?{max:maxY}:{})},
        },
      }}
    />
  );
}

export function LineChart({ labels, datasets }) {
  const COLS = ['#7B52B8','#2E9B6A','#C96B84','#2872B8'];
  return (
    <Line
      data={{
        labels,
        datasets: datasets.map((d,i) => ({
          label: d.label,
          data:  d.data,
          borderColor: d.color || COLS[i % COLS.length],
          backgroundColor: (d.color || COLS[i % COLS.length]) + '22',
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: d.color || COLS[i % COLS.length],
          tension: .38,
          fill: !!d.fill,
        })),
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{ labels:{ color:tickColor, font:{family:fontFamily,weight:'700',size:11}}}},
        scales: {
          x: { grid:{color:gridColor}, ticks:{color:tickColor,font:{family:fontFamily}}},
          y: { grid:{color:gridColor}, ticks:{color:tickColor,font:{family:fontFamily}}, beginAtZero:true },
        },
      }}
    />
  );
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
export function Badge({ risk }) {
  const cfg = { high:['bh','● High'], moderate:['bm','● Moderate'], low:['bl','● Low'] };
  const [cls, txt] = cfg[risk] || ['bl','● Low'];
  return <span className={`badge ${cls}`}>{txt}</span>;
}

// ── RISK BAR ─────────────────────────────────────────────────────────────────
export function RiskBar({ score, risk, fac }) {
  const col = risk==='high' ? '#D4607A' : risk==='moderate' ? '#C28A00' : '#2E9B6A';
  return (
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      <div className={`rbar${fac?' fac':''}`}>
        <div className="rbar-fill" style={{width:`${score}%`, background:col}}/>
      </div>
      <span style={{fontSize:11,color:'var(--muted)',fontWeight:700}}>{score}%</span>
    </div>
  );
}

// ── YEAR TABS ─────────────────────────────────────────────────────────────────
export function YearTabs({ active, onChange, fac }) {
  return (
    <div className="ytabs">
      {['all',1,2,3,4].map(y => (
        <button key={y} className={`ytab${fac?' fac':''} ${String(active)===String(y)?'active':''}`}
          onClick={()=>onChange(y)}>
          {y==='all' ? 'All Years' : `Year ${y}`}
        </button>
      ))}
    </div>
  );
}

// ── SIDEBAR ────────────────────────────────────────────────────────────────────
export function Sidebar({ user, nav, active, onNav, onLogout, fac }) {
  return (
    <div className={`sidebar${fac?' fac':''}`}>
      <div className="brand">
        <div className="brand-row">
          <div className={`brand-ico${fac?' fac':''}`}>📚</div>
          <div>
            <div className="brand-name">AcadPredict</div>
            <div className="brand-tag">{fac ? 'Faculty Portal' : 'Admin Portal'}</div>
          </div>
        </div>
      </div>

      <div className={`user-chip${fac?' fac':''}`}>
        <div className="u-name">{user.name}</div>
        <div className="u-email">{user.email}</div>
        <div className={`u-badge${fac?' fac':''}`}>{fac ? `👩‍🏫 ${user.dept}` : '🔑 Administrator'}</div>
      </div>

      <div style={{padding:'0 4px',flex:1}}>
        <div className="nav-sec">Navigation</div>
        {nav.map(n => (
          <button key={n.key} className={`nav-btn${fac?' fac':''} ${active===n.key?'active':''}`} onClick={()=>onNav(n.key)}>
            <span className="nav-ico">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>

      <div className="logout-wrap">
        <button className="logout-btn" onClick={onLogout}>← Sign Out</button>
      </div>
    </div>
  );
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
export function Topbar({ title, sub, user, fac }) {
  return (
    <div className={`topbar${fac?' fac':''}`}>
      <div className="topbar-left">
        <div className="pt">{title}</div>
        <div className="pb">{sub}</div>
      </div>
      <div className="topbar-right">
        <span className="topbar-email">{user.email}</span>
        <div className={`av${fac?' fac':''}`}>{(user.name||'?')[0]}</div>
      </div>
    </div>
  );
}

// ── LOADER ────────────────────────────────────────────────────────────────────
export function Loader({ fac }) {
  return (
    <div className="loader-wrap">
      <div className={`spin${fac?' fac':''}`}/>
      <div style={{fontSize:13,color:'var(--muted)',fontWeight:600}}>Loading…</div>
    </div>
  );
}

// ── ERROR ─────────────────────────────────────────────────────────────────────
export function ErrBox({ msg }) {
  return (
    <div className="card" style={{color:'#C96B84',fontWeight:700}}>
      ⚠️ {msg}<br/>
      <small style={{fontWeight:400,color:'var(--muted)'}}>Is the backend running on port 3000?</small>
    </div>
  );
}
