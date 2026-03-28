import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, Topbar, Loader, ErrBox, RiskDonut, BarChart, LineChart, Badge, YearTabs, RiskBar } from '../Shared';
import api from '../api';
import { downloadPDF } from '../downloadPdf';

const NAV = [
  { key:'dashboard',    icon:'🏠', label:'Dashboard' },
  { key:'risk',         icon:'⚠️', label:'Risk Monitor' },
  { key:'students',     icon:'🎓', label:'Student Profiles' },
  { key:'intervention', icon:'💊', label:'Interventions' },
  { key:'reports',      icon:'📋', label:'Reports' },
];

export default function FacultyShell({ user, onLogout }) {
  const [page,   setPage]  = useState('dashboard');
  const [selId,  setSel]   = useState(null);
  const [year,   setYear]  = useState('all');

  const TITLES = { dashboard:'Faculty Dashboard', risk:'Risk Monitor', students:'Student Profiles', intervention:'Intervention Panel', reports:'Reports' };

  const goStudent = (id) => { setSel(id); setPage('students'); };

  return (
    <div className="app-shell">
      <Sidebar user={user} nav={NAV} active={page} onNav={setPage} onLogout={onLogout} fac/>
      <div className="main-area">
        <Topbar title={TITLES[page]} sub={`Faculty Portal · ${user.dept}`} user={user} fac/>
        <div className="page-content fac page-anim">
          {page==='dashboard'    && <FDashboard    user={user} year={year} setYear={setYear}/>}
          {page==='risk'         && <FRisk         user={user} year={year} setYear={setYear} onView={goStudent}/>}
          {page==='students'     && <FStudents     user={user} year={year} setYear={setYear} selId={selId} setSel={setSel}/>}
          {page==='intervention' && <FIntervention user={user}/>}
          {page==='reports'      && <FReports      user={user} year={year} setYear={setYear}/>}
        </div>
      </div>
    </div>
  );
}

// ── PAGE 1: DASHBOARD ─────────────────────────────────────────────────────────
function FDashboard({ user, year, setYear }) {
  const [data,setData]  = useState(null);
  const [loading,setL]  = useState(true);
  const [err,setErr]    = useState('');

  const yv = year==='all' ? null : year;
  useEffect(() => {
    setL(true);
    api.facDashboard(yv).then(r=>setData(r.data)).catch(e=>setErr(e.message)).finally(()=>setL(false));
  }, [year]);

  if (loading) return <Loader fac/>;
  if (err)     return <ErrBox msg={err}/>;
  const { riskDist:rd, yearStats:ys, improvements:imp } = data;

  return (
    <>
      <div style={{fontSize:12,color:'var(--muted)',fontWeight:700,marginBottom:14}}>📍 {user.dept} — {data.totalStudents} Students (125 per year)</div>
      <YearTabs active={year} onChange={setYear} fac/>
      <div className="stats-grid mb20">
        <div className="stat-card s1 fac"><span className="sc-ico">🎓</span><div className="sc-lbl">Students</div><div className="sc-val" style={{color:'#C96B84'}}>{data.totalStudents}</div><div className="sc-sub">{year==='all'?'All 4 years':'Year '+year}</div></div>
        <div className="stat-card s2 fac"><span className="sc-ico">📅</span><div className="sc-lbl">Avg Attendance</div><div className="sc-val" style={{color:'#2872B8'}}>{data.avgAttendance}%</div><div className="sc-sub">Target: 75%+</div></div>
        <div className="stat-card s3 fac"><span className="sc-ico">📝</span><div className="sc-lbl">Avg Internal</div><div className="sc-val" style={{color:'#B8860B'}}>{data.avgInternal}%</div><div className="sc-sub">Target: 65%+</div></div>
        <div className="stat-card s4 fac"><span className="sc-ico">🚨</span><div className="sc-lbl">High Risk</div><div className="sc-val" style={{color:'#C86B38'}}>{data.highRisk}</div><div className="sc-sub">Need intervention</div></div>
      </div>

      <div className="g2 mb14">
        <div className="card fac"><div className="card-title">📊 Year-wise Pass Rate</div><div style={{height:220}}><BarChart labels={ys.map(y=>`Year ${y.year}`)} datasets={[{label:'Pass Rate %',data:ys.map(y=>y.passRate),color:'#C96B84'}]}/></div></div>
        <div className="card fac"><div className="card-title">📅 Attendance Trend (Weekly)</div><div style={{height:220}}><LineChart labels={['W1','W2','W3','W4','W5','W6','W7','W8']} datasets={[{label:'Avg Attendance %',data:[data.avgAttendance-12,data.avgAttendance-10,data.avgAttendance-8,data.avgAttendance-5,data.avgAttendance-3,data.avgAttendance-1,data.avgAttendance,data.avgAttendance+1].map(v=>Math.max(0,Math.min(99,v))),color:'#2E9B6A',fill:true}]}/></div></div>
      </div>

      {imp && imp.length > 0 && (
        <div className="card fac" style={{background:'var(--fac-lt)',border:'2px solid rgba(201,107,132,.25)'}}>
          <div className="card-title">🤖 AI Improvement Suggestions — {user.dept}</div>
          {imp.map((t,i) => (
            <div key={i} style={{display:'flex',gap:10,marginBottom:8}}>
              <span style={{fontSize:16}}>💡</span>
              <span style={{fontSize:13,fontWeight:600,color:'var(--text2)'}}>{t}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── PAGE 2: RISK MONITOR ──────────────────────────────────────────────────────
function FRisk({ user, year, setYear, onView }) {
  const [data,setData]  = useState(null);
  const [loading,setL]  = useState(true);
  const [err,setErr]    = useState('');

  const yv = year==='all' ? null : year;
  useEffect(() => {
    setL(true);
    api.facRisk(yv).then(r=>setData(r.data)).catch(e=>setErr(e.message)).finally(()=>setL(false));
  }, [year]);

  if (loading) return <Loader fac/>;
  if (err)     return <ErrBox msg={err}/>;

  const high = data.filter(s=>s.risk==='high').length;
  const mod  = data.filter(s=>s.risk==='moderate').length;

  return (
    <>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
        <span className="badge bh" style={{fontSize:12,padding:'7px 16px'}}>🔴 High Risk: {high}</span>
        <span className="badge bm" style={{fontSize:12,padding:'7px 16px'}}>🟡 Moderate: {mod}</span>
        <span style={{background:'var(--fac-lt)',color:'var(--fac-pri)',padding:'7px 18px',borderRadius:20,fontSize:12,fontWeight:800,border:'2px solid rgba(201,107,132,.25)'}}>📋 Showing: {data.length}</span>
      </div>
      <YearTabs active={year} onChange={setYear} fac/>
      <div className="tw fac"><div className="ts"><table>
        <thead><tr>
          {['Student','Roll No','Yr','Risk','ML Score','Attendance','Internal','Assignment','Final',''].map(h=>(
            <th key={h} className="fac">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {data.map(s => (
            <tr key={s._id} style={{background:s.risk==='high'?'rgba(212,96,122,.04)':s.risk==='moderate'?'rgba(194,138,0,.04)':'transparent'}}>
              <td className="fac" style={{fontWeight:700}}>{s.name}</td>
              <td className="fac" style={{fontFamily:'var(--fm)',fontSize:11,color:'var(--muted)'}}>{s.roll_no}</td>
              <td className="fac" style={{color:'var(--muted)'}}>Y{s.year}</td>
              <td className="fac"><Badge risk={s.risk}/></td>
              <td className="fac"><RiskBar score={s.risk_score} risk={s.risk} fac/></td>
              <td className="fac" style={{color:s.attendance<65?'#C96B84':'#2E9B6A',fontWeight:800}}>{s.attendance}%</td>
              <td className="fac">{s.internal}%</td>
              <td className="fac">{s.assignment}%</td>
              <td className="fac">{s.final_exam}%</td>
              <td className="fac"><button onClick={()=>onView(s._id)} style={{padding:'5px 14px',borderRadius:20,border:'2px solid var(--fac-lt)',background:'var(--fac-lt)',color:'var(--fac-pri)',fontSize:11,fontWeight:800}}>View →</button></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </>
  );
}

// ── PAGE 3: STUDENT PROFILES ──────────────────────────────────────────────────
function FStudents({ user, year, setYear, selId, setSel }) {
  const [list,    setList]   = useState([]);
  const [selData, setSelData]= useState(null);
  const [loading, setL]      = useState(true);
  const [loadS,   setLS]     = useState(false);
  const [err,     setErr]    = useState('');

  const yv = year==='all' ? null : year;

  useEffect(() => {
    setL(true);
    api.facStudents(yv).then(r=>{ setList(r.data); if(!selId&&r.data.length) setSel(r.data[0]._id); }).catch(e=>setErr(e.message)).finally(()=>setL(false));
  }, [year]);

  useEffect(() => {
    if (!selId) return;
    setLS(true);
    api.facStudent(selId).then(r=>setSelData(r.data)).catch(()=>{}).finally(()=>setLS(false));
  }, [selId]);

  if (loading) return <Loader fac/>;
  if (err)     return <ErrBox msg={err}/>;

  const pMap = {
    critical: ['#FFE8EE','rgba(212,96,122,.4)','#C96B84','🔴 Critical'],
    high:     ['#FFF8E0','rgba(194,138,0,.4)', '#B8860B','🟡 High'],
    moderate: ['#E4F0FF','rgba(40,114,184,.4)','#2872B8','🔵 Moderate'],
    good:     ['#E4F8EF','rgba(46,155,106,.4)','#2E9B6A','🟢 Good'],
  };

  return (
    <>
      <YearTabs active={year} onChange={setYear} fac/>
      <div style={{display:'grid',gridTemplateColumns:'230px 1fr',gap:14,alignItems:'start'}}>
        {/* LIST — full height, no scroll cap */}
        <div className="card fac" style={{padding:12}}>
          <div style={{fontSize:10,color:'var(--muted)',fontWeight:900,marginBottom:10,letterSpacing:.6}}>{list.length} STUDENTS</div>
          {list.map(s => (
            <button key={s._id} className={`sli${s._id===selId?' active':''}`} onClick={()=>setSel(s._id)}>
              <div style={{fontSize:12,fontWeight:s._id===selId?800:600}}>{s.name}</div>
              <div style={{fontSize:10,marginTop:2,opacity:.9}}>Yr {s.year} · <span style={{fontWeight:800}}>{s.risk}</span></div>
            </button>
          ))}
        </div>

        {/* DETAIL — sticky so it stays visible while scrolling list */}
        {loadS ? <Loader fac/> : selData ? (
          <div style={{display:'flex',flexDirection:'column',gap:13,position:'sticky',top:80}}>
            <div className="card fac">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
                <div>
                  <h2 style={{fontFamily:'var(--fs)',fontSize:22,fontStyle:'italic',marginBottom:5}}>{selData.name}</h2>
                  <p style={{fontSize:12,color:'var(--muted)',fontWeight:600}}>{selData.roll_no} · Year {selData.year} · {selData.dept} · Semester {selData.sem}</p>
                </div>
                <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{textAlign:'center',padding:'12px 18px',borderRadius:16,background:selData.risk==='high'?'#FFE8EE':selData.risk==='moderate'?'#FFF8E0':'#E4F8EF',border:`2px solid ${selData.risk==='high'?'#C96B84':selData.risk==='moderate'?'#C28A00':'#2E9B6A'}33`}}>
                    <div style={{fontSize:28,fontWeight:900,color:selData.risk==='high'?'#C96B84':selData.risk==='moderate'?'#C28A00':'#2E9B6A'}}>{selData.risk_score}%</div>
                    <div style={{fontSize:10,color:'var(--muted)',fontWeight:700,marginTop:2}}>ML Risk Score</div>
                  </div>
                  <Badge risk={selData.risk}/>
                </div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:18,flexWrap:'wrap'}}>
                {[['📅 Attendance',selData.attendance,'#C96B84'],['📝 Internal',selData.internal,'#2872B8'],['📋 Assignment',selData.assignment,'#B8860B'],['🎯 Final Exam',selData.final_exam,'#2E9B6A']].map(([l,v,c])=>(
                  <div key={l} style={{flex:1,minWidth:90,textAlign:'center',padding:'16px 10px',borderRadius:16,background:'var(--fac-bg)',border:'2px solid var(--fac-border)'}}>
                    <div style={{fontSize:24,fontWeight:900,color:c}}>{v}%</div>
                    <div style={{fontSize:10,color:'var(--muted)',marginTop:5,fontWeight:700}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="g2">
              <div className="card fac"><div className="card-title">📅 Attendance Trend</div><div style={{height:150}}><LineChart labels={['W1','W2','W3','W4','W5','Now']} datasets={[{label:'Attendance %',data:selData.trend.attendance,color:'#C96B84',fill:true}]}/></div></div>
              <div className="card fac"><div className="card-title">📝 Internal Trend</div><div style={{height:150}}><LineChart labels={['W1','W2','W3','W4','W5','Now']} datasets={[{label:'Internal %',data:selData.trend.internal,color:'#2872B8',fill:true}]}/></div></div>
            </div>

            <div className="card fac" style={{background:'var(--fac-lt)',border:'2px solid rgba(201,107,132,.25)'}}>
              <div className="card-title">🤖 AI Recommendations</div>
              {selData.recommendations.map((r,i) => {
                const [bg,bd,tc,tag] = pMap[r.priority] || pMap.moderate;
                return (
                  <div key={i} style={{background:'#fff',borderRadius:14,padding:'14px 16px',marginBottom:11,borderLeft:`4px solid ${tc}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:7,flexWrap:'wrap',gap:6}}>
                      <span style={{fontSize:12,fontWeight:800,color:tc}}>💡 {r.area}</span>
                      <span className="badge" style={{background:bg,color:tc,border:`1.5px solid ${tc}33`}}>{tag}</span>
                    </div>
                    <p style={{fontSize:13,lineHeight:1.85,color:'var(--text2)',fontWeight:600}}>{r.tip}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : <div className="card fac">Select a student from the list.</div>}
      </div>
    </>
  );
}

// ── PAGE 4: INTERVENTIONS ─────────────────────────────────────────────────────
function FIntervention({ user }) {
  const [atRisk, setAtRisk]  = useState([]);
  const [intMap, setIntMap]  = useState({});
  const [loading, setL]      = useState(true);
  const [err, setErr]        = useState('');

  const ACTIONS = ['Assign Remedial Class','Recommend Tutoring','Schedule Counseling','Send Parent Notification'];
  const CYCLE   = { none:'inprogress', inprogress:'completed', completed:'none' };
  const SCFG    = { none:{cls:'ib-none',txt:'+ Assign'}, inprogress:{cls:'ib-inprogress',txt:'⏳ In Progress'}, completed:{cls:'ib-completed',txt:'✅ Done'} };

  const load = useCallback(async () => {
    setL(true);
    try {
      const { data: riskList } = await api.facRisk();
      const risks = riskList.filter(s => s.risk !== 'low');
      setAtRisk(risks);
      const map = {};
      await Promise.all(risks.map(async s => {
        try { const { data } = await api.facIntv(s._id); map[s._id] = data.interventions || {}; }
        catch { map[s._id] = {}; }
      }));
      setIntMap(map);
    } catch(e) { setErr(e.message); }
    finally { setL(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const cycleAction = async (id, action) => {
    const cur  = (intMap[id] || {})[action] || 'none';
    const next = CYCLE[cur];
    await api.updateIntv(id, action, next);
    setIntMap(m => ({ ...m, [id]: { ...m[id], [action]: next==='none'?undefined:next } }));
  };

  if (loading) return <Loader fac/>;
  if (err)     return <ErrBox msg={err}/>;

  return (
    <>
      <div style={{background:'var(--fac-lt)',border:'2px solid rgba(201,107,132,.25)',borderRadius:16,padding:'13px 18px',marginBottom:18}}>
        <span style={{fontSize:12,fontWeight:700,color:'var(--fac-pri)'}}>
          💡 Click buttons to cycle: <b>+ Assign → ⏳ In Progress → ✅ Completed → Removed</b>. Changes saved in memory.
        </span>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap'}}>
        <span className="badge bh" style={{fontSize:12,padding:'6px 16px'}}>⚠️ {atRisk.filter(s=>s.risk==='high').length} High Risk</span>
        <span className="badge bm" style={{fontSize:12,padding:'6px 16px'}}>🟡 {atRisk.filter(s=>s.risk==='moderate').length} Moderate</span>
      </div>

      {atRisk.map(s => {
        const iv = intMap[s._id] || {};
        const assigned = ACTIONS.filter(a => iv[a] && iv[a] !== 'none').length;
        const done     = ACTIONS.filter(a => iv[a] === 'completed').length;
        const pct      = Math.round(done / ACTIONS.length * 100);

        return (
          <div key={s._id} className="card fac" style={{marginBottom:13,borderLeft:`4px solid ${s.risk==='high'?'#C96B84':'#C28A00'}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8,marginBottom:12}}>
              <div>
                <span style={{fontWeight:900,fontSize:15}}>{s.name}</span>
                <span style={{marginLeft:10}}><Badge risk={s.risk}/></span>
                <span style={{fontSize:11,color:'var(--muted)',marginLeft:8,fontFamily:'var(--fm)'}}>{s.roll_no} · Yr {s.year}</span>
              </div>
              <div style={{fontSize:11,color:'var(--muted)',fontWeight:700}}>
                Att: <b style={{color:s.attendance<65?'#C96B84':'#2E9B6A'}}>{s.attendance}%</b>&nbsp;|&nbsp;
                Int: <b>{s.internal}%</b>
                {assigned>0 && <>&nbsp;|&nbsp;<b style={{color:'#2E9B6A'}}>{done}/{ACTIONS.length} done</b></>}
              </div>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom: s.risk==='high'||assigned>0 ? 12 : 0}}>
              {ACTIONS.map(action => {
                const st  = iv[action] || 'none';
                const cfg = SCFG[st];
                return (
                  <button key={action} className={`ib ${cfg.cls}`} onClick={()=>cycleAction(s._id, action)}>
                    {st==='none' ? `+ ${action}` : `${cfg.txt} — ${action}`}
                  </button>
                );
              })}
            </div>

            {s.risk==='high' && (
              <div style={{fontSize:12,fontWeight:700,color:'#C96B84',background:'#FFE8EE',padding:'10px 14px',borderRadius:12,border:'1.5px solid rgba(212,96,122,.3)',marginBottom:assigned>0?12:0}}>
                🤖 ML model flags critical risk. Immediate remedial + counseling strongly recommended.
              </div>
            )}

            {assigned > 0 && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--muted)',fontWeight:700,marginBottom:6}}>
                  <span>Intervention Progress</span><span>{done}/{ACTIONS.length} ({pct}%)</span>
                </div>
                <div style={{background:'#FFE0EA',borderRadius:10,height:8,overflow:'hidden'}}>
                  <div style={{width:`${pct}%`,height:8,borderRadius:10,transition:'width .4s',background:pct===100?'#2E9B6A':'#C96B84'}}/>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ── PAGE 5: REPORTS ───────────────────────────────────────────────────────────
function FReports({ user, year, setYear }) {
  const [rep,    setRep]   = useState(null);
  const [risk,   setRisk]  = useState([]);
  const [loading,setL]     = useState(true);
  const [err,    setErr]   = useState('');

  const yv = year==='all' ? null : year;
  useEffect(() => {
    setL(true);
    Promise.all([api.facReports(yv), api.facRisk(yv)])
      .then(([r1,r2]) => { setRep(r1.data); setRisk(r2.data); })
      .catch(e => setErr(e.message))
      .finally(() => setL(false));
  }, [year]);

  if (loading) return <Loader fac/>;
  if (err)     return <ErrBox msg={err}/>;
  const rd = rep.riskDist;

  return (
    <>
      <YearTabs active={year} onChange={setYear} fac/>
      <div className="g2 mb18">
        <div className="card fac">
          <div style={{fontWeight:800,fontSize:14,marginBottom:5}}>📊 Course Performance</div>
          <div style={{fontSize:11,color:'var(--muted)',marginBottom:16,fontWeight:600}}>Grades and attendance breakdown</div>
          <button className="dl-btn fac" onClick={()=>downloadPDF(
            `${user.dept} Course Performance Report`,'','course',
            {students:risk, dept:user.dept, year:year==='all'?null:year}
          )}>⬇ Download PDF</button>
        </div>
        <div className="card fac">
          <div style={{fontWeight:800,fontSize:14,marginBottom:5}}>📝 Student Progress</div>
          <div style={{fontSize:11,color:'var(--muted)',marginBottom:16,fontWeight:600}}>Individual improvement tracking</div>
          <button className="dl-btn fac" onClick={()=>downloadPDF(
            `${user.dept} Student Progress Report`,'','progress',
            {students:risk, dept:user.dept}
          )}>⬇ Download PDF</button>
        </div>
      </div>
      <div className="card fac mb14">
        <div className="card-title">📉 Attendance — First 30 Students</div>
        <div style={{height:210}}>
          <BarChart labels={risk.slice(0,30).map(s=>s.name.split(' ')[0])} datasets={[{label:'Attendance %',data:risk.slice(0,30).map(s=>s.attendance),color:'#C96B84'}]}/>
        </div>
      </div>
      <div className="g2 mb14">
        <div className="card fac">
          <div className="card-title">🍩 Risk Distribution</div>
          <div style={{height:210}}><RiskDonut high={rd.high} moderate={rd.moderate} low={rd.low}/></div>
        </div>
        <div className="card fac">
          <div className="card-title">📋 Summary — {user.dept}</div>
          {[['Total Students',rep.totalStudents,'#C96B84'],['High Risk',rd.high,'#C96B84'],['Moderate',rd.moderate,'#C28A00'],['Low Risk',rd.low,'#2E9B6A'],['Avg Attendance',rep.avgAttendance+'%','#2E9B6A'],['Avg Internal',rep.avgInternal+'%','#2872B8']].map(([l,v,c])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--fac-border)'}}>
              <span style={{fontSize:12,color:'var(--muted)',fontWeight:600}}>{l}</span>
              <span style={{fontSize:14,fontWeight:900,color:c}}>{typeof v==='number'?v.toLocaleString():v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card fac">
        <div className="card-title">📋 Student Table — {risk.length} students</div>
        <div className="tw fac"><div className="ts"><table>
          <thead><tr>{['Name','Roll No','Year','Att.','Internal','Assignment','Final','Risk'].map(h=><th key={h} className="fac">{h}</th>)}</tr></thead>
          <tbody>{risk.map(s=>(
            <tr key={s._id}>
              <td className="fac" style={{fontWeight:700}}>{s.name}</td>
              <td className="fac" style={{fontFamily:'var(--fm)',fontSize:11,color:'var(--muted)'}}>{s.roll_no}</td>
              <td className="fac" style={{color:'var(--muted)'}}>Y{s.year}</td>
              <td className="fac" style={{color:s.attendance<65?'#C96B84':'#2E9B6A',fontWeight:800}}>{s.attendance}%</td>
              <td className="fac">{s.internal}%</td>
              <td className="fac">{s.assignment}%</td>
              <td className="fac">{s.final_exam}%</td>
              <td className="fac"><Badge risk={s.risk}/></td>
            </tr>
          ))}</tbody>
        </table></div></div>
      </div>
    </>
  );
}
