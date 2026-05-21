import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import SeekerDashboard from './pages/SeekerDashboard';
import HRDashboard from './pages/HRDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      
      if (json.success) {
        setUser(json.user);
        setProfile(json.profile);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    fetchCurrentUser(); // fetches profile if user is a seeker
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--primary)',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid var(--border-color)',
          borderTop: '5px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ fontSize: '18px', fontWeight: '600', fontFamily: 'var(--font-family-display)' }}>
          JJ Just Job is loading...
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={user} logout={logout} />
      
      <main style={{ flex: '1' }}>
        <Routes>
          {/* Public Home/Landing */}
          <Route path="/" element={<Landing user={user} profile={profile} refreshMe={fetchCurrentUser} />} />
          
          {/* Auth Tab Page */}
          <Route path="/auth" element={<Auth login={login} user={user} />} />
          
          {/* Seeker Private Dashboard */}
          <Route 
            path="/seeker-dashboard" 
            element={
              user ? (
                user.role === 'seeker' ? (
                  <SeekerDashboard user={user} profile={profile} refreshMe={fetchCurrentUser} />
                ) : (
                  <Navigate to="/hr-dashboard" replace />
                )
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          
          {/* HR Recruiter Private Dashboard */}
          <Route 
            path="/hr-dashboard" 
            element={
              user ? (
                user.role === 'recruiter' ? (
                  <HRDashboard user={user} />
                ) : (
                  <Navigate to="/seeker-dashboard" replace />
                )
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
