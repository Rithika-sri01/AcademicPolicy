import React, { useState } from 'react';
import api from './api';

const DEMOS = {
  admin: [
    { e:'admin1@college.edu', p:'admin123', n:'Dr. Ramesh Kumar',   s:'Super Admin' },
    { e:'admin2@college.edu', p:'admin123', n:'Dr. Priya Nair',     s:'Admin' },
    { e:'admin3@college.edu', p:'admin123', n:'Dr. Suresh Pillai',  s:'Admin' },
  ],
  faculty: [
    { e:'faculty1@college.edu', p:'faculty123', n:'Prof. Anita Sharma', s:'CSE' },
    { e:'faculty2@college.edu', p:'faculty123', n:'Prof. Kiran Das',    s:'EEE' },
    { e:'faculty3@college.edu', p:'faculty123', n:'Prof. Sneha Iyer',   s:'EIE' },
    { e:'faculty4@college.edu', p:'faculty123', n:'Prof. Ravi Verma',   s:'MECHANICAL' },
    { e:'faculty5@college.edu', p:'faculty123', n:'Prof. Meena Reddy',  s:'MECHATRONICS' },
  ],
};

export default function Login({ onLogin }) {
  const [role,    setRole]    = useState('admin');
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const fill = (e, p) => { setEmail(e); setPw(p); setErr(''); };

  const doLogin = async () => {
    setErr(''); setLoading(true);
    try {
      const { data } = await api.login(email, pw);
      if (data.user.role !== role) { setErr(`This account is "${data.user.role}". Please switch the role tab.`); setLoading(false); return; }
      localStorage.setItem('ap_token', data.token);
      localStorage.setItem('ap_user',  JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      setErr(e.response?.data?.error || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-bg">
      {/* Animated blobs */}
      <div className="login-blob" style={{width:520,height:520,background:'#FADADD',top:-160,left:-160,opacity:.45,borderRadius:'50%',filter:'blur(80px)',position:'fixed'}}/>
      <div className="login-blob" style={{width:420,height:420,background:'#E8DAFF',bottom:-120,right:-120,opacity:.45,borderRadius:'50%',filter:'blur(80px)',position:'fixed'}}/>
      <div className="login-blob" style={{width:300,height:300,background:'#C8F0E0',top:'45%',left:'55%',transform:'translate(-50%,-50%)',opacity:.3,borderRadius:'50%',filter:'blur(80px)',position:'fixed'}}/>

      <div className="login-wrap">
        <div style={{textAlign:'center',marginBottom:26}}>
          <div className="login-logo-ring">📚</div>
          <div className="login-title">AcadPredict</div>
          <div className="login-sub">Predictive Academic Policy Analyzer</div>
        </div>

        <div className="login-card">
          {/* Role Toggle */}
          <div className="role-toggle">
            <div className={`role-card ${role==='admin'?'sel-a':''}`} onClick={()=>{setRole('admin');setErr('');}}>
              <span className="rc-ico">🔑</span>
              <div className="rc-lbl">Administrator</div>
              <div className="rc-sub">Full system access</div>
            </div>
            <div className={`role-card ${role==='faculty'?'sel-f':''}`} onClick={()=>{setRole('faculty');setErr('');}}>
              <span className="rc-ico">👩‍🏫</span>
              <div className="rc-lbl">Faculty</div>
              <div className="rc-sub">Department view</div>
            </div>
          </div>

          {err && <div className="err-box">⚠️ {err}</div>}

          <label className="fl">Email Address</label>
          <input className="fi" type="email" placeholder="your@college.edu" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>

          <label className="fl">Password</label>
          <input className="fi" type="password" placeholder="Enter your password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} style={{marginBottom:22}}/>

          <button className={role==='admin'?'login-btn-a':'login-btn-f'} onClick={doLogin} disabled={loading}>
            {loading ? 'Signing in…' : `Sign in as ${role==='admin'?'Administrator':'Faculty'} →`}
          </button>

         
        </div>
      </div>
    </div>
  );
}
