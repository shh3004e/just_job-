import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Briefcase, User as UserIcon, LogOut, LayoutDashboard, PlusCircle } from 'lucide-react';

const Navbar = ({ user, logout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Custom Logo Component using CSS theme colors
  const Logo = () => (
    <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        color: 'white',
        fontWeight: '800',
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
        display: 'flex',
        alignItems: 'center'
      }}>
        <span style={{ color: 'var(--primary)' }}>Just</span>
        <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>Job</span>
      </span>
    </Link>
  );

  return (
    <nav className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 0',
      marginBottom: '20px'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Logo />

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="nav-desktop">
          <Link to="/" style={{
            color: isActive('/') ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: isActive('/') ? '700' : '500',
            fontSize: '15px'
          }}>
            Home
          </Link>

          {user && user.role === 'seeker' && (
            <Link to="/seeker-dashboard" style={{
              color: isActive('/seeker-dashboard') ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: isActive('/seeker-dashboard') ? '700' : '500',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <LayoutDashboard size={16} />
              Seeker Panel
            </Link>
          )}

          {user && user.role === 'recruiter' && (
            <Link to="/hr-dashboard" style={{
              color: isActive('/hr-dashboard') ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: isActive('/hr-dashboard') ? '700' : '500',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <LayoutDashboard size={16} />
              HR Panel
            </Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>{user.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'capitalize', fontWeight: 'bold' }}>
                  {user.role === 'recruiter' ? 'Hiring Manager' : 'Job Seeker'}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '20px' }}>
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/auth" className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '14px', borderRadius: '20px' }}>
                Sign In
              </Link>
              <Link to="/auth?signup=true" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '14px', borderRadius: '20px' }}>
                Join Now
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation Toggle (Simple logout directly visible on top mobile bar to avoid clutter) */}
        {user && (
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary nav-mobile-logout" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px', 
              borderRadius: '20px', 
              display: 'none',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <LogOut size={12} />
            Exit
          </button>
        )}
      </div>

      {/* Mobile App Bottom Tab Bar Navigation */}
      <div className="mobile-bottom-nav">
        <Link to="/" className={`mobile-tab-item ${isActive('/') ? 'active' : ''}`}>
          <Briefcase size={20} />
          <span>Jobs</span>
        </Link>

        {user ? (
          <>
            <Link 
              to={user.role === 'seeker' ? '/seeker-dashboard' : '/hr-dashboard'} 
              className={`mobile-tab-item ${isActive('/seeker-dashboard') || isActive('/hr-dashboard') ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>

            <button 
              onClick={handleLogout} 
              className="mobile-tab-item"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)' }}
            >
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/auth" className={`mobile-tab-item ${isActive('/auth') && !location.search.includes('signup') ? 'active' : ''}`}>
              <UserIcon size={20} />
              <span>Sign In</span>
            </Link>
            <Link to="/auth?signup=true" className={`mobile-tab-item ${isActive('/auth') && location.search.includes('signup') ? 'active' : ''}`}>
              <PlusCircle size={20} />
              <span>Join</span>
            </Link>
          </>
        )}
      </div>

      {/* Embedded CSS for Navbar layout responsiveness */}
      <style dangerouslySetInnerHTML={{__html: `
        .mobile-bottom-nav {
          display: none;
        }
        @media (max-width: 768px) {
          .nav-desktop {
            display: none !important;
          }
          .nav-mobile-logout {
            display: flex !important;
          }
          /* Show Bottom Nav Bar on Mobile */
          .mobile-bottom-nav {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 64px;
            background-color: var(--bg-card);
            border-top: 1px solid var(--border-color);
            justify-content: space-around;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 -3px 12px rgba(0, 0, 0, 0.08);
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .mobile-tab-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            height: 100%;
            color: var(--text-muted);
            font-size: 11px;
            font-weight: 500;
            text-decoration: none;
            gap: 4px;
            transition: var(--transition);
          }
          .mobile-tab-item.active {
            color: var(--primary);
            font-weight: 700;
          }
          /* Adjust main body margin bottom so content isn't hidden under nav bar */
          body {
            margin-bottom: 74px !important;
          }
        }
      `}} />
    </nav>
  );
};

export default Navbar;
