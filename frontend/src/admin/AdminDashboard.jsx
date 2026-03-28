import React, { useState, useEffect } from 'react';
import { Sidebar, Topbar, Loader, ErrBox, RiskDonut, BarChart, LineChart, Badge, YearTabs, RiskBar } from '../Shared';
import api from '../api';
import { downloadPDF } from '../downloadPdf';

const NAV = [
  { key:'dashboard', icon:'🏠', label:'Dashboard' },
  { key:'policy',    icon:'⚖️', label:'Policy Comparison' },
  { key:'impact',    icon:'📊', label:'Student Impact' },
  { key:'reports',   icon:'📋', label:'Reports' },
];

export default function AdminShell({ user, onLogout }) {
  const [page, setPage] = useState('dashboard');
  const TITLES = { dashboard:'Admin Dashboard', policy:'Policy Comparison', impact:'Student Impact', reports:'Reports' };

  return (
    <div className="app-shell">
      <Sidebar user={user} nav={NAV} active={page} onNav={setPage} onLogout={onLogout} fac={false}/>
      <div className="main-area">
        <Topbar title={TITLES[page]} sub="Admin Portal · AcadPredict" user={user} fac={false}/>
        <div className="page-content page-anim">
          {page==='dashboard' && <ADashboard/>}
          {page==='policy'    && <APolicy/>}
          {page==='impact'    && <AImpact/>}
          {page==='reports'   && <AReports/>}
        </div>
      </div>
    </div>
  );
}

// ── PAGE 1: DASHBOARD ─────────────────────────────────────────────────────────
function ADashboard() {
  const [data, setData]   = useState(null);
  const [loading, setL]   = useState(true);
  const [err, setErr]     = useState('');

  useEffect(() => {
    api.adminDashboard().then(r=>setData(r.data)).catch(e=>setErr(e.message)).finally(()=>setL(false));
  }, []);

  if (loading) return <Loader/>;
  if (err)     return <ErrBox msg={err}/>;
  const { deptStats:ds, riskDist:rd, semTrend, totalStudents, avgPassRate, highRisk } = data;
  const depts = Object.keys(ds);
  const PAL = ['#C4A8E8','#88CFBA','#F2A8BE','#88B8E0','#F0D888'];

  return (
    <>
      <div style={{fontSize:12,color:'var(--muted)',fontWeight:700,marginBottom:14}}>
        🏫 System Overview — {totalStudents.toLocaleString()} Students | 5 Departments
      </div>
      <div className="stats-grid mb20">
        <div className="stat-card s1"><span className="sc-ico">🎓</span><div className="sc-lbl">Total Students</div><div className="sc-val" style={{color:'#7B52B8'}}>{totalStudents.toLocaleString()}</div><div className="sc-sub">5 depts × 4 yrs × 125</div></div>
        <div className="stat-card s2"><span className="sc-ico">✅</span><div className="sc-lbl">Overall Pass Rate</div><div className="sc-val" style={{color:'#2E9B6A'}}>{avgPassRate}%</div><div className="sc-sub">ML-computed</div></div>
        <div className="stat-card s3"><span className="sc-ico">⚠️</span><div className="sc-lbl">At-Risk Students</div><div className="sc-val" style={{color:'#C96B84'}}>{highRisk.toLocaleString()}</div><div className="sc-sub">Need intervention</div></div>
        <div className="stat-card s4"><span className="sc-ico">📋</span><div className="sc-lbl">Active Policies</div><div className="sc-val" style={{color:'#B8860B'}}>2</div><div className="sc-sub">Policy B under review</div></div>
      </div>

      <div className="g2 mb14">
        <div className="card">
          <div className="card-title">📊 Department Pass Rates</div>
          <div style={{height:220}}><BarChart labels={depts} datasets={[{label:'Pass Rate %',data:depts.map(d=>ds[d].passRate),color:'#7B52B8'}]}/></div>
        </div>
        <div className="card">
          <div className="card-title">🍩 Risk Distribution ({totalStudents.toLocaleString()} Students)</div>
          <div style={{height:220}}><RiskDonut high={rd.high} moderate={rd.moderate} low={rd.low}/></div>
        </div>
      </div>

      <div className="card mb14">
        <div className="card-title">📈 8-Semester Performance Trend</div>
        <div style={{height:200}}>
          <LineChart labels={semTrend.map(s=>s.sem)}
            datasets={[{label:'Pass Rate (%)',data:semTrend.map(s=>s.passRate),fill:true,color:'#7B52B8'},{label:'Avg Attendance (%)',data:semTrend.map(s=>s.avgAttendance),color:'#2E9B6A'}]}/>
        </div>
      </div>

      <div className="g4">
        {depts.map((dep,i) => (
          <div key={dep} className="card" style={{borderTop:`3px solid ${PAL[i]}`}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:12}}>{dep}</div>
            {[['Pass Rate',ds[dep].passRate+'%',PAL[i]],['Avg Att.',ds[dep].avgAttendance+'%','#2E9B6A'],['High Risk',ds[dep].riskCount,'#C96B84'],['Students',ds[dep].totalStudents,'#9A8EA8']].map(([l,v,c])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #F5F0FF'}}>
                <span style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>{l}</span>
                <span style={{fontSize:13,fontWeight:900,color:c}}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ── PAGE 2: POLICY ────────────────────────────────────────────────────────────
function APolicy() {
  const [data,    setData]   = useState(null);
  const [loading, setL]     = useState(true);
  const [err,     setErr]   = useState('');

  const load = () => { setL(true); api.adminPolicy().then(r=>setData(r.data)).catch(e=>setErr(e.message)).finally(()=>setL(false)); };
  useEffect(load, []);

  if (loading) return <Loader/>;
  if (err)     return <ErrBox msg={err}/>;

  const { A:pa, B:pb } = data;
  const diff = pb.predictedPassRate - pa.predictedPassRate;
  const rec = diff>5 ? `✅ Policy B raises the predicted pass rate by +${diff}%. Strongly recommended for adoption across all departments.`
            : diff>0 ? `Policy B shows a marginal gain of +${diff}%. Consider tuning the remedial and continuous assessment weights further.`
            : diff===0 ? `Both policies yield the same predicted pass rate. Adjust Policy B sliders to explore improvements.`
            : `⚠️ Policy B currently underperforms by ${Math.abs(diff)}%. Re-tune the parameters, especially internal weight and remedial intervention.`;

  const KEYS = [['attendancePolicy','Attendance Policy'],['internalWeight','Internal Marks Weight'],['finalExamWeight','Final Exam Weight'],['continuousAssessment','Continuous Assessment'],['remedialIntervention','Remedial Intervention']];

  const update = async (k, v) => {
    try { await api.updatePolicyB({ [k]: Number(v) }); load(); } catch(e){}
  };

  return (
    <>
      <div className="g2 mb14">
        {/* POLICY A */}
        <div className="card" style={{borderTop:'3px solid #2872B8'}}>
          <div style={{background:'#E4F0FF',borderRadius:14,padding:'13px 16px',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontWeight:800,fontSize:14}}>📌 Policy A — Current</div><div style={{fontSize:11,color:'var(--muted)',marginTop:2,fontWeight:600}}>Baseline policy · Locked</div></div>
            <span style={{fontSize:10,background:'#fff',color:'#2872B8',padding:'4px 14px',borderRadius:20,fontWeight:800,border:'1.5px solid #88B8E0'}}>🔒 Read only</span>
          </div>
          {KEYS.map(([k,l]) => (
            <div key={k} className="sl-row">
              <div className="sl-top"><span className="sl-lbl">{l}</span><span style={{fontSize:13,fontWeight:900,color:'#2872B8',fontFamily:'var(--fm)'}}>{pa[k]}%</span></div>
              <input type="range" min="0" max="100" value={pa[k]} disabled/>
            </div>
          ))}
          <div style={{textAlign:'center',padding:20,background:'#E4F0FF',borderRadius:16,marginTop:14}}>
            <div style={{fontSize:40,fontWeight:900,color:'#2872B8'}}>{pa.predictedPassRate}%</div>
            <div style={{fontSize:11,color:'var(--muted)',fontWeight:700,marginTop:4}}>Predicted Pass Rate</div>
          </div>
        </div>

        {/* POLICY B */}
        <div className="card" style={{borderTop:'3px solid #7B52B8'}}>
          <div style={{background:'#EDE8FF',borderRadius:14,padding:'13px 16px',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontWeight:800,fontSize:14,color:'#7B52B8'}}>✏️ Policy B — Proposed</div><div style={{fontSize:11,color:'var(--muted)',marginTop:2,fontWeight:600}}>Drag sliders to simulate</div></div>
            <button onClick={async()=>{await api.resetPolicyB();load();}} style={{fontSize:10,background:'#fff',color:'#7B52B8',padding:'4px 14px',borderRadius:20,fontWeight:800,border:'1.5px solid #C4A8E8'}}>↺ Reset</button>
          </div>
          {KEYS.map(([k,l]) => (
            <div key={k} className="sl-row">
              <div className="sl-top"><span className="sl-lbl">{l}</span><span className="sl-val">{pb[k]}%</span></div>
              <input type="range" min="0" max="100" defaultValue={pb[k]} onMouseUp={e=>update(k,e.target.value)} onTouchEnd={e=>update(k,e.target.value)}/>
            </div>
          ))}
          <div style={{textAlign:'center',padding:20,background:'#EDE8FF',borderRadius:16,marginTop:14}}>
            <div style={{fontSize:40,fontWeight:900,color:'#7B52B8'}}>{pb.predictedPassRate}%</div>
            <div style={{fontSize:11,color:'var(--muted)',fontWeight:700,marginTop:4}}>Predicted Pass Rate</div>
            <div style={{fontSize:13,fontWeight:900,marginTop:8,color:diff>0?'#2E9B6A':diff<0?'#C96B84':'#9A8EA8'}}>
              {diff>0?`▲ +${diff}%`:diff<0?`▼ ${diff}%`:'= Same'} vs Policy A
            </div>
          </div>
        </div>
      </div>

      <div className="card mb14">
        <div className="card-title">📊 Pass Rate Comparison</div>
        <div style={{height:180}}><BarChart labels={['Policy A','Policy B']} datasets={[{label:'Predicted Pass Rate %',data:[pa.predictedPassRate,pb.predictedPassRate],color:'#7B52B8'}]}/></div>
      </div>

      <div className="card" style={{background:diff>0?'#E4F8EF':diff<0?'#FFE8EE':'#EDE8FF',borderColor:diff>0?'#88D8B8':diff<0?'#F2A8B8':'#C4A8E8'}}>
        <div className="card-title">🤖 AI Recommendation</div>
        <p style={{fontSize:13,lineHeight:1.9,color:'var(--text2)',fontWeight:600}}>{rec}</p>
      </div>
    </>
  );
}

// ── PAGE 3: STUDENT IMPACT ────────────────────────────────────────────────────
function AImpact() {
  const [data,loading,err] = useFetch(api.adminImpact);
  if (loading) return <Loader/>;
  if (err)     return <ErrBox msg={err}/>;
  const { yearStats:ys, deptStats:ds } = data;
  const depts = Object.keys(ds);
  const PAL = ['#C4A8E8','#88CFBA','#F2A8BE','#88B8E0','#F0D888'];

  return (
    <>
      <div className="g2 mb14">
        <div className="card"><div className="card-title">📊 Department Pass Rates</div><div style={{height:220}}><BarChart labels={depts} datasets={[{label:'Pass Rate %',data:depts.map(d=>ds[d].passRate),color:'#7B52B8'}]}/></div></div>
        <div className="card"><div className="card-title">📅 Year-wise Pass Rate</div><div style={{height:220}}><BarChart labels={ys.map(y=>`Year ${y.year}`)} datasets={[{label:'Pass Rate %',data:ys.map(y=>y.passRate),color:'#2E9B6A'}]}/></div></div>
      </div>
      <div className="card mb14">
        <div className="card-title">⚠️ Risk by Year</div>
        <div style={{height:210}}>
          <BarChart labels={ys.map(y=>`Year ${y.year}`)} datasets={[
            {label:'High',     data:ys.map(y=>y.high),     color:'#F2A8BE'},
            {label:'Moderate', data:ys.map(y=>y.moderate), color:'#F0D888'},
            {label:'Low',      data:ys.map(y=>y.low),      color:'#88CFBA'},
          ]}/>
        </div>
      </div>
      <div className="g4">
        {depts.map((dep,i) => (
          <div key={dep} className="card" style={{borderLeft:`4px solid ${PAL[i]}`}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:12}}>{dep}</div>
            {[['Pass Rate',ds[dep].passRate+'%',PAL[i]],['Avg Att.',ds[dep].avgAttendance+'%','#2E9B6A'],['High Risk',ds[dep].riskCount,'#C96B84'],['Students',ds[dep].totalStudents,'#9A8EA8']].map(([l,v,c])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #F5F0FF'}}>
                <span style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>{l}</span>
                <span style={{fontSize:13,fontWeight:900,color:c}}>{typeof v==='number'?v.toLocaleString():v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ── PAGE 4: REPORTS ───────────────────────────────────────────────────────────
function AReports() {
  const [data,loading,err] = useFetch(api.adminReports);
  if (loading) return <Loader/>;
  if (err)     return <ErrBox msg={err}/>;
  const { riskDist:rd, semTrend:st, policyA:pa, policyB:pb, totalStudents } = data;

  return (
    <>
      <div className="g3 mb18">
        <div className="card">
          <div style={{fontWeight:800,fontSize:14,marginBottom:5}}>📅 Semester Performance</div>
          <div style={{fontSize:11,color:'var(--muted)',marginBottom:16,fontWeight:600}}>8-semester analytics</div>
          <button className="dl-btn" onClick={()=>downloadPDF('Semester Performance Report','','semester',{semTrend:st})}>⬇ Download PDF</button>
        </div>
        <div className="card">
          <div style={{fontWeight:800,fontSize:14,marginBottom:5}}>⚖️ Policy Analysis</div>
          <div style={{fontSize:11,color:'var(--muted)',marginBottom:16,fontWeight:600}}>Policy A vs B comparison</div>
          <button className="dl-btn" onClick={()=>downloadPDF('Policy Comparison Report','','policy',{pa,pb})}>⬇ Download PDF</button>
        </div>
        <div className="card">
          <div style={{fontWeight:800,fontSize:14,marginBottom:5}}>🏫 Dept Analytics</div>
          <div style={{fontSize:11,color:'var(--muted)',marginBottom:16,fontWeight:600}}>Per-department breakdown</div>
          <button className="dl-btn" onClick={async()=>{
            const r = await api.adminDashboard();
            downloadPDF('Department Analytics Report','','dept',{deptStats:r.data.deptStats});
          }}>⬇ Download PDF</button>
        </div>
      </div>
      <div className="card mb14">
        <div className="card-title">📈 8-Semester Trend</div>
        <div style={{height:210}}>
          <LineChart labels={st.map(s=>s.sem)} datasets={[{label:'Pass Rate (%)',data:st.map(s=>s.passRate),fill:true,color:'#7B52B8'},{label:'Avg Attendance (%)',data:st.map(s=>s.avgAttendance),color:'#2E9B6A'}]}/>
        </div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-title">⚖️ Policy A vs B</div>
          <div style={{height:160,marginBottom:14}}><BarChart labels={['Policy A','Policy B']} datasets={[{label:'Predicted Pass Rate %',data:[pa.predictedPassRate,pb.predictedPassRate],color:'#7B52B8'}]}/></div>
          {['attendancePolicy','internalWeight','finalExamWeight','continuousAssessment','remedialIntervention'].map((k,i)=>{
            const lbls=['Attendance','Internal','Final Exam','Continuous','Remedial'];
            return <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F5F0FF',fontSize:12}}>
              <span style={{color:'var(--muted)',fontWeight:600}}>{lbls[i]}</span>
              <span><span style={{color:'#2872B8',fontWeight:800}}>{pa[k]}%</span><span style={{color:'var(--muted)',margin:'0 8px'}}>→</span><span style={{color:'#7B52B8',fontWeight:800}}>{pb[k]}%</span></span>
            </div>;
          })}
        </div>
        <div className="card">
          <div className="card-title">🚦 Risk Summary — {totalStudents.toLocaleString()} Students</div>
          <div style={{display:'flex',gap:10,marginBottom:18}}>
            {[['High Risk',rd.high,'#C96B84','#FFE8EE'],['Moderate',rd.moderate,'#C28A00','#FFF8E0'],['Low Risk',rd.low,'#2E9B6A','#E4F8EF']].map(([l,v,c,bg])=>(
              <div key={l} style={{flex:1,textAlign:'center',padding:'18px 8px',borderRadius:16,background:bg,border:`2px solid ${c}33`}}>
                <div style={{fontSize:28,fontWeight:900,color:c}}>{v.toLocaleString()}</div>
                <div style={{fontSize:10,color:'var(--muted)',fontWeight:700,marginTop:3}}>{l}</div>
                <div style={{fontSize:11,color:c,fontWeight:800,marginTop:2}}>{Math.round(v/totalStudents*100)}%</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',padding:16,background:'#EDE8FF',borderRadius:14}}>
            <div style={{fontSize:34,fontWeight:900,color:'#7B52B8'}}>{totalStudents.toLocaleString()}</div>
            <div style={{fontSize:11,color:'var(--muted)',fontWeight:700}}>Total Students Analyzed</div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:8,fontStyle:'italic'}}>All data generated via scikit-learn RandomForest ML model simulation.</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── HOOK ──────────────────────────────────────────────────────────────────────
function useFetch(fetchFn) {
  const [data,setData]     = useState(null);
  const [loading,setLoad]  = useState(true);
  const [err,setErr]       = useState('');
  useEffect(() => {
    setLoad(true);
    fetchFn().then(r=>setData(r.data)).catch(e=>setErr(e.message)).finally(()=>setLoad(false));
  }, []);
  return [data, loading, err];
}
