import React, { useState, useEffect } from 'react';
import Login from './Login';
import AdminShell from './admin/AdminDashboard';
import FacultyShell from './faculty/FacultyDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ap_token');
    const saved  = localStorage.getItem('ap_user');

    if (!token || !saved) {
      setChecking(false);
      return;
    }

    fetch('https://academicpolicy.onrender.com/api/auth/me', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(res => {
        if (res.ok) {
          setUser(JSON.parse(saved));
        } else {
          localStorage.removeItem('ap_token');
          localStorage.removeItem('ap_user');
        }
      })
      .catch(() => {
        localStorage.removeItem('ap_token');
        localStorage.removeItem('ap_user');
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin  = (userData) => setUser(userData);
  const handleLogout = () => {
    localStorage.removeItem('ap_token');
    localStorage.removeItem('ap_user');
    setUser(null);
  };

  if (checking) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F2EEFF'}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:44,height:44,border:'4px solid #EDE8FF',borderTopColor:'#7B52B8',borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 14px'}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{fontSize:13,color:'#9A8EA8',fontWeight:600}}>Loading AcadPredict…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} />;
  if (user.role === 'admin') return <AdminShell user={user} onLogout={handleLogout} />;
  return <FacultyShell user={user} onLogout={handleLogout} />;
}
