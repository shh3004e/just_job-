import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, UserPlus, Briefcase, User as UserIcon, Mail, Lock, ShieldAlert } from 'lucide-react';

const mockAccounts = [
  {
    name: 'Emily Watson',
    email: 'emily.watson@gmail.com',
    role: 'seeker',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=emily'
  },
  {
    name: 'Marcus Chen',
    email: 'marcus.chen@gmail.com',
    role: 'seeker',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=marcus'
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@gmail.com',
    role: 'recruiter',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sarah'
  },
  {
    name: 'Alex HR',
    email: 'cu674300@gmail.com',
    role: 'recruiter',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alex'
  }
];

const Auth = ({ login, user }) => {
  const [searchParams] = useSearchParams();
  const isSignupParam = searchParams.get('signup') === 'true';

  const [isLoginTab, setIsLoginTab] = useState(!isSignupParam);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'seeker' // default to Job Seeker
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMockModal, setShowMockModal] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const roleRef = useRef(formData.role);
  const navigate = useNavigate();

  // Sync role selection to ref for Google Sign-In callbacks
  useEffect(() => {
    roleRef.current = formData.role;
  }, [formData.role]);

  // Handle Google Login Responses (Real/Mock)
  const handleGoogleCredentialResponse = async (response, overrideRole) => {
    setError('');
    setLoading(true);
    const selectedRole = overrideRole || roleRef.current;
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credential: response.credential,
          role: selectedRole
        })
      });

      const json = await res.json();
      if (json.success) {
        login(json.token, json.user);
      } else {
        setError(json.message || 'Google Authentication failed');
      }
    } catch (err) {
      setError('Could not connect to the auth server.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleLogin = (account) => {
    setShowMockModal(false);
    setFormData(prev => ({ ...prev, role: account.role }));
    handleGoogleCredentialResponse({
      credential: `mock_google_token_${account.email}`
    }, account.role);
  };

  // Initialize official Google Sign-in if client ID is present
  useEffect(() => {
    const initGoogle = () => {
      if (window.google && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (res) => handleGoogleCredentialResponse(res)
          });
          const btnParent = document.getElementById("google-signin-btn");
          if (btnParent) {
            window.google.accounts.id.renderButton(
              btnParent,
              { theme: "outline", size: "large", width: "100%", text: "continue_with" }
            );
          }
        } catch (err) {
          console.error("Error initializing Google Identity Services:", err);
        }
      }
    };

    if (googleClientId) {
      if (window.google) {
        initGoogle();
      } else {
        const interval = setInterval(() => {
          if (window.google) {
            clearInterval(interval);
            initGoogle();
          }
        }, 500);
        return () => clearInterval(interval);
      }
    }
  }, [googleClientId]);

  // Watch for search query change
  useEffect(() => {
    setIsLoginTab(!isSignupParam);
  }, [isSignupParam]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'recruiter') {
        navigate('/hr-dashboard');
      } else {
        navigate('/seeker-dashboard');
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLoginTab ? '/api/auth/login' : '/api/auth/register';
    const payload = isLoginTab 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        login(json.token, json.user);
        // Redirects are handled by useEffect
      } else {
        setError(json.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Could not connect to the auth server.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to prefill details for testing
  const handlePrefill = (selectedRole) => {
    setError('');
    if (selectedRole === 'seeker') {
      setFormData({
        name: 'Jane Doe',
        email: 'jane.design@example.com',
        password: 'password123',
        role: 'seeker'
      });
    } else {
      setFormData({
        name: 'Alex HR',
        email: 'cu674300@gmail.com', // use existing recruiter email from db.json
        password: 'password123',
        role: 'recruiter'
      });
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '30px 0' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        minHeight: '80vh',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        backgroundColor: 'white',
        border: '1px solid var(--border-color)'
      }} className="auth-split-grid">
        
        {/* Left Side: Gradient Banner Section (Screenshot 4 Alignment) */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          color: 'white',
          padding: '60px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }} className="auth-left-banner">
          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '80px' }}>
              <div style={{
                background: 'white',
                color: 'var(--primary)',
                fontWeight: '900',
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontFamily: 'var(--font-family-display)'
              }}>
                JJ
              </div>
              <span style={{
                fontFamily: 'var(--font-family-display)',
                fontWeight: '800',
                fontSize: '22px',
                letterSpacing: '-0.5px',
                color: 'white'
              }}>
                Just Job
              </span>
            </div>
            
            <h1 style={{
              fontSize: '44px',
              fontWeight: '800',
              lineHeight: '1.2',
              fontFamily: 'var(--font-family-display)',
              marginBottom: '20px'
            }}>
              Your design career,<br />
              on the right canvas.
            </h1>
            <p style={{ fontSize: '18px', opacity: 0.9, fontWeight: '400', lineHeight: '1.5' }}>
              One sign-in. Choose your path — apply to jobs or hire fresh talent.
            </p>
          </div>
          
          <div style={{ fontSize: '13px', opacity: 0.7 }}>
            Powered by Emergent • Secure Google sign-in
          </div>
        </div>
        
        {/* Right Side: Authentication Panel Section */}
        <div style={{
          padding: '50px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'white'
        }} className="auth-right-panel">
          
          {/* Welcome Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#1d2226', fontFamily: 'var(--font-family-display)' }}>Welcome</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Sign in to continue to JJ Just Job.
            </p>
          </div>

          {/* Continue with Google Button */}
          {googleClientId ? (
            <div id="google-signin-btn" style={{ width: '100%', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}></div>
          ) : (
            <button 
              type="button"
              onClick={() => setShowMockModal(true)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)',
                backgroundColor: 'white',
                color: 'var(--text-main)',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                marginBottom: '24px',
                transition: 'var(--transition)'
              }}
              className="btn-outline-hover"
            >
              {/* Simple Mock Google Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.4 13a5.53 5.53 0 0 1 5.59-5.514c2.19 0 3.91.815 5.12 1.954l3.21-3.21C20.39 4.352 17.48 3 14 3a10 10 0 0 0-10 10 10 0 0 0 10 10c5.52 0 10-4.48 10-10 0-.675-.06-1.32-.176-1.943l-9.584.228z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {/* Tab Selection: Sign In vs Register */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--border-color)',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: isLoginTab ? '3px solid var(--primary)' : '3px solid transparent',
                color: isLoginTab ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isLoginTab ? '700' : '500',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'var(--transition)'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: !isLoginTab ? '3px solid var(--primary)' : '3px solid transparent',
                color: !isLoginTab ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: !isLoginTab ? '700' : '500',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'var(--transition)'
              }}
            >
              Register
            </button>
          </div>

          {/* Role selector cards (available for selection) */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Seeker Option Card */}
              <div
                onClick={() => {
                  handleRoleSelect('seeker');
                  handlePrefill('seeker');
                }}
                style={{
                  border: formData.role === 'seeker' ? '2px solid #10b981' : '1.5px solid var(--border-color)',
                  backgroundColor: formData.role === 'seeker' ? '#f0fdf4' : 'white',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#10b981' }}>Job Seeker</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>For fresher graphic / UI-UX designers.</div>
              </div>

              {/* Recruiter Option Card */}
              <div
                onClick={() => {
                  handleRoleSelect('recruiter');
                  handlePrefill('recruiter');
                }}
                style={{
                  border: formData.role === 'recruiter' ? '2px solid #10b981' : '1.5px solid var(--border-color)',
                  backgroundColor: formData.role === 'recruiter' ? '#f0fdf4' : 'white',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#059669' }}>Hiring Manager</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>Post designer roles in minutes.</div>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              backgroundColor: 'var(--error-bg)',
              color: 'var(--error)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1.5px solid var(--error)'
            }}>
              {error}
            </div>
          )}

          {/* Login/Register Inputs Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!isLoginTab && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                required
                className="form-control"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                style={{ borderRadius: '8px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px', borderRadius: '8px', cursor: 'pointer' }}
            >
              {loading ? 'Processing...' : isLoginTab ? 'Sign In' : 'Register Account'}
            </button>
          </form>

          {/* Fine print policy */}
          <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '20px', textAlign: 'center' }}>
            By continuing, you agree to receive transactional emails about your applications and hiring.
          </div>

        </div>
      </div>

      {/* Responsive adjustments */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .auth-split-grid {
            grid-template-columns: 1fr !important;
          }
          .auth-left-banner {
            display: none !important;
          }
          .auth-right-panel {
            padding: 30px 20px !important;
          }
        }
      `}} />

      {/* Google Mock Account Selector Modal */}
      {showMockModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(5px)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '30px',
            width: '90%',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowMockModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                lineHeight: 1
              }}
            >
              &times;
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px', fontFamily: 'var(--font-family-display)', textAlign: 'center', color: '#1d2226' }}>
              Choose an account
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center' }}>
              to continue to <strong style={{ color: 'var(--primary)' }}>JJ Just Job</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mockAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleMockGoogleLogin(account)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border-color)',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    gap: '14px',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <img 
                    src={account.avatar} 
                    alt={account.name} 
                    style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border-color)' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{account.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{account.email}</div>
                  </div>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '3px 8px', 
                    borderRadius: '12px', 
                    fontWeight: '700',
                    backgroundColor: account.role === 'seeker' ? '#f0fdf4' : '#eff6ff',
                    color: account.role === 'seeker' ? '#16a34a' : '#2563eb'
                  }}>
                    {account.role === 'seeker' ? 'Seeker' : 'Recruiter'}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-light)', textAlign: 'center', lineHeight: '1.4' }}>
              This simulates secure Google login in local sandbox mode. Select a profile to sign in instantly.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
