import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, DollarSign, Calendar, Users, Eye, CheckCircle2, ChevronRight, Award, Laptop, Palette, Sparkles, Briefcase, Check } from 'lucide-react';
import suryanshImg from '../assets/suryansh.jpg';
import heroImg from '../assets/hero.png';

const Landing = ({ user, profile, refreshMe }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState({ type: '', text: '' });
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'details'
  const [acceptedSeekers, setAcceptedSeekers] = useState([]);

  const navigate = useNavigate();

  const heroRef = React.useRef(null);
  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const { left, top, width, height } = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - (left + width / 2)) / (width / 2);
    const y = (e.clientY - (top + height / 2)) / (height / 2);
    heroRef.current.style.setProperty('--mouse-x', x.toFixed(3));
    heroRef.current.style.setProperty('--mouse-y', y.toFixed(3));
  };
  const handleMouseLeave = () => {
    if (!heroRef.current) return;
    heroRef.current.style.setProperty('--mouse-x', '0');
    heroRef.current.style.setProperty('--mouse-y', '0');
  };

  useEffect(() => {
    if (user && user.role === 'seeker' && !profile) {
      navigate('/seeker-dashboard');
      return;
    }
    fetchJobs();
    fetchAcceptedSeekers();
  }, [user, profile, navigate]);

  const fetchAcceptedSeekers = async () => {
    try {
      const res = await fetch('/api/applications/accepted-seekers');
      const json = await res.json();
      if (json.success) {
        setAcceptedSeekers(json.data);
      }
    } catch (err) {
      console.error('Error fetching accepted seekers:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      const json = await res.json();
      if (json.success) {
        setJobs(json.data);
        if (json.data.length > 0) {
          setSelectedJob(json.data[0]); // Select first job by default on desktop
        }
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (user.role !== 'seeker') {
      setApplyMessage({ type: 'error', text: 'Only Job Seekers can apply for jobs!' });
      return;
    }

    if (!profile) {
      setApplyMessage({ type: 'error', text: 'You must complete your profile on the dashboard before applying!' });
      setTimeout(() => navigate('/seeker-dashboard'), 2000);
      return;
    }

    try {
      setApplyLoading(true);
      setApplyMessage({ type: '', text: '' });

      const res = await fetch(`/api/applications/apply/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();

      if (json.success) {
        setApplyMessage({ type: 'success', text: 'Applied successfully! An email confirmation has been sent to you.' });
        // Refresh jobs (in case status changed to closed due to vacancy cap)
        fetchJobs();
        refreshMe();
      } else {
        setApplyMessage({ type: 'error', text: json.message || 'Failed to apply' });
      }
    } catch (err) {
      setApplyMessage({ type: 'error', text: 'Server error' });
    } finally {
      setApplyLoading(false);
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesRole = roleFilter === 'All' || job.role === roleFilter;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tools.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Calculate dynamic metrics for Top Tracks card
  const gdCount = jobs.filter(job => job.role === 'Graphic Designer').length;
  const uiCount = jobs.filter(job => job.role === 'UI/UX Designer').length;
  const mgCount = jobs.filter(job => job.role === 'Motion Graphic Designer').length;
  const maxTrackCount = Math.max(gdCount, uiCount, mgCount, 1);
  const gdHeight = gdCount > 0 ? (gdCount / maxTrackCount) * 100 : 10;
  const uiHeight = uiCount > 0 ? (uiCount / maxTrackCount) * 100 : 10;
  const mgHeight = mgCount > 0 ? (mgCount / maxTrackCount) * 100 : 10;

  return (
    <div className="container animate-fade-in" style={{ minHeight: '80vh' }}>
      
      {/* 1. Hero Stack Section (Centered Mockup Design with Smart Parallax) */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '60px 0 20px 0',
          marginBottom: '20px',
          position: 'relative'
        }} 
        className="hero-stack-section"
      >
        {/* Top Feature Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-full)',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: '700',
          color: '#059669',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '24px',
          alignSelf: 'center'
        }}>
          <Sparkles size={13} style={{ fill: '#059669' }} /> Built for fresher designers • 0-12 months
        </div>
        
        {/* Centered Large Display Headline */}
        <h1 style={{
          fontSize: '52px',
          fontWeight: '800',
          lineHeight: '1.15',
          color: '#1d2226',
          fontFamily: 'var(--font-family-display)',
          marginBottom: '20px',
          letterSpacing: '-1px',
          textAlign: 'center',
          maxWidth: '850px'
        }}>
          Land your first <span style={{ color: 'var(--primary)' }}>design job</span>.<br />
          Hire your next <span style={{ color: 'var(--primary)' }}>creative</span>.
        </h1>
        
        {/* Centered Descriptive Paragraph */}
        <p style={{
          fontSize: '17px',
          color: 'var(--text-muted)',
          lineHeight: '1.6',
          marginBottom: '36px',
          maxWidth: '680px',
          textAlign: 'center'
        }}>
          JJ Just Job is a focused portal where <strong>Graphic Designers</strong>, <strong>Motion Graphic Designers</strong>, and <strong>UI/UX Designers</strong> with AI-tool experience meet hiring managers — without the noise.
        </p>

        {/* Sleek Centered Pill Search Container (Mockup search style) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-full)',
          padding: '6px 6px 6px 20px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          width: '100%',
          maxWidth: '650px',
          marginBottom: '16px',
          gap: '12px',
          zIndex: 5
        }} className="hero-search-bar">
          <Search size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search jobs by title, area, or tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              flex: '1',
              fontSize: '15px',
              color: 'var(--text-main)',
              background: 'transparent'
            }}
          />
          
          {/* Vertical divider */}
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
          
          {/* Dropdown Selector for roleFilter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-muted)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              paddingRight: '12px'
            }}
          >
            <option value="All">All Roles</option>
            <option value="Graphic Designer">Graphic Designer</option>
            <option value="UI/UX Designer">UI/UX Designer</option>
            <option value="Motion Graphic Designer">Motion Graphic Designer</option>
          </select>
          
          <button
            onClick={() => {
              document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
            className="hero-search-btn"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Popular/Quick Search Tags (Mockup alignment) */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '50px',
          zIndex: 5
        }}>
          <span style={{ fontWeight: '600' }}>Popular Roles:</span>
          {['All', 'Graphic Designer', 'UI/UX Designer', 'Motion Graphic Designer'].map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role);
                document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                border: 'none',
                background: roleFilter === role ? 'var(--primary-light)' : 'transparent',
                color: roleFilter === role ? 'var(--primary)' : 'var(--text-main)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontWeight: roleFilter === role ? '700' : '500',
                fontSize: '13px',
                transition: 'var(--transition)'
              }}
              className="popular-tag-btn"
            >
              {role}
            </button>
          ))}
        </div>

        {/* Centered Graphic Parallax Container */}
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: '850px',
          height: '480px',
          margin: '0 auto',
          padding: '20px',
          overflow: 'visible'
        }} className="hero-illustration-parallax">
          
          {/* Curved SVG overlay background underlay */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} viewBox="0 0 850 480">
            <path d="M 100 200 Q 250 120 280 260" fill="none" stroke="var(--border-color)" strokeWidth="2.5" strokeDasharray="8,8" opacity="0.5" />
            <path d="M 750 200 Q 600 120 570 260" fill="none" stroke="var(--border-color)" strokeWidth="2.5" strokeDasharray="8,8" opacity="0.5" />
          </svg>

          {/* Radial gradient background light glow */}
          <div style={{
            position: 'absolute',
            width: '480px',
            height: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(10, 102, 194, 0.16) 0%, rgba(15, 118, 110, 0.04) 55%, rgba(255,255,255,0) 75%)',
            zIndex: 1,
            transform: 'translate(calc(var(--mouse-x, 0) * 15px), calc(var(--mouse-y, 0) * 15px))',
            transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
          }}></div>

          {/* Center 3D Character Illustration */}
          <div style={{
            zIndex: 2,
            width: '100%',
            maxWidth: '380px',
            transform: 'translate(calc(var(--mouse-x, 0) * 12px), calc(var(--mouse-y, 0) * 12px))',
            transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
          }} className="hero-main-character">
            <img 
              src={heroImg} 
              alt="Design Professional Illustration" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                display: 'block',
                filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.12))'
              }} 
            />
          </div>
          
          {/* FLOATING BADGE 1: Application Received (Left Upper) */}
          <div style={{
            position: 'absolute',
            top: '15%',
            left: '3%',
            backgroundColor: 'white',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '16px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10,
            transform: 'translate(calc(var(--mouse-x, 0) * -22px), calc(var(--mouse-y, 0) * -22px))',
            transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
          }} className="floating-card">
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0
            }}>
              <CheckCircle2 size={16} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#1d2226' }}>Application received</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>UI/UX Designer • Bengaluru</div>
            </div>
          </div>

          {/* FLOATING BADGE 2: Top Tracks Chart (Left Lower) */}
          <div style={{
            position: 'absolute',
            bottom: '12%',
            left: '1%',
            backgroundColor: 'white',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '16px',
            padding: '16px',
            width: '180px',
            zIndex: 10,
            transform: 'translate(calc(var(--mouse-x, 0) * -16px), calc(var(--mouse-y, 0) * -16px))',
            transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
          }} className="floating-card">
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'left' }}>Top Tracks</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '60px', paddingBottom: '4px' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--primary)', height: `${gdHeight}%`, borderRadius: '3px 3px 0 0', position: 'relative', transition: 'height 0.4s ease-out' }} title={`Graphic Design: ${gdCount} jobs`}>
                <span style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 'bold' }}>GD</span>
                {gdCount > 0 && <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', fontWeight: '800', color: 'var(--primary)' }}>{gdCount}</span>}
              </div>
              <div style={{ flex: 1, backgroundColor: 'var(--accent)', height: `${uiHeight}%`, borderRadius: '3px 3px 0 0', position: 'relative', transition: 'height 0.4s ease-out' }} title={`UI/UX Design: ${uiCount} jobs`}>
                <span style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 'bold' }}>UI</span>
                {uiCount > 0 && <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', fontWeight: '800', color: 'var(--accent)' }}>{uiCount}</span>}
              </div>
              <div style={{ flex: 1, backgroundColor: '#ea580c', height: `${mgHeight}%`, borderRadius: '3px 3px 0 0', position: 'relative', transition: 'height 0.4s ease-out' }} title={`Motion Graphics: ${mgCount} jobs`}>
                <span style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 'bold' }}>MG</span>
                {mgCount > 0 && <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', fontWeight: '800', color: '#ea580c' }}>{mgCount}</span>}
              </div>
            </div>
          </div>

          {/* FLOATING BADGE 3: Avg Min Salary (Right Upper) */}
          <div style={{
            position: 'absolute',
            top: '18%',
            right: '2%',
            backgroundColor: 'white',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '16px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10,
            transform: 'translate(calc(var(--mouse-x, 0) * 28px), calc(var(--mouse-y, 0) * 28px))',
            transition: 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1)'
          }} className="floating-card">
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#e8f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              flexShrink: 0
            }}>
              <DollarSign size={16} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#1d2226' }}>₹12,000+/mo</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>Avg. Min. Salary</div>
            </div>
          </div>

          {/* FLOATING BADGE 4: Seeker Avatars & Quote (Right Lower) */}
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '1%',
            backgroundColor: 'white',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '16px',
            padding: '12px 16px',
            width: '200px',
            zIndex: 10,
            transform: 'translate(calc(var(--mouse-x, 0) * 20px), calc(var(--mouse-y, 0) * 20px))',
            transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
          }} className="floating-card">
            <div style={{ display: 'flex', marginBottom: '8px' }} className="avatar-group">
              {acceptedSeekers.length > 0 ? (
                acceptedSeekers.slice(0, 5).map((seeker, idx) => {
                  const zIndex = 5 - idx;
                  const marginLeft = idx === 0 ? '0' : '-8px';
                  const initials = seeker.fullName ? seeker.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
                  
                  const bgColors = ['#0a66c2', '#0f766e', '#ea580c', '#6366f1', '#ec4899'];
                  const bgColor = bgColors[idx % bgColors.length];

                  return (
                    <div 
                      key={seeker._id || idx}
                      style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '50%', 
                        border: '2px solid white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: bgColor, 
                        color: 'white', 
                        fontSize: '9px', 
                        fontWeight: 'bold', 
                        marginLeft: marginLeft, 
                        zIndex: zIndex,
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      title={`${seeker.fullName} (${seeker.position})`}
                    >
                      {seeker.photoUrl ? (
                        <img 
                          src={seeker.photoUrl} 
                          alt={seeker.fullName} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        initials
                      )}
                    </div>
                  );
                })
              ) : (
                <>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#0a66c2', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 'bold', zIndex: 3 }}>S</div>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#0f766e', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 'bold', marginLeft: '-8px', zIndex: 2 }}>D</div>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#ea580c', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 'bold', marginLeft: '-8px', zIndex: 1 }}>M</div>
                </>
              )}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4', textAlign: 'left' }}>
              Empowering <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>fresher designers</span> with direct industry opportunities.
            </div>
          </div>

          {/* Floating Decorative SVG/Icons */}
          <span style={{
            position: 'absolute',
            top: '32%',
            left: '26%',
            zIndex: 1,
            color: 'rgba(10, 102, 194, 0.35)',
            transform: 'translate(calc(var(--mouse-x, 0) * -35px), calc(var(--mouse-y, 0) * -35px))',
            transition: 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1)'
          }}><Palette size={24} /></span>

          <span style={{
            position: 'absolute',
            bottom: '38%',
            right: '26%',
            zIndex: 1,
            color: 'rgba(234, 88, 12, 0.35)',
            transform: 'translate(calc(var(--mouse-x, 0) * 35px), calc(var(--mouse-y, 0) * 35px))',
            transition: 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1)'
          }}><Laptop size={24} /></span>
        </div>

        {/* Buttons and Quick Stats Row */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', margin: '30px 0 40px 0', zIndex: 5 }}>
          <button 
            onClick={() => navigate('/auth')} 
            className="btn btn-primary" 
            style={{ padding: '12px 26px', fontSize: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Get started <ChevronRight size={16} />
          </button>
          <button 
            onClick={() => {
              document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="btn" 
            style={{
              padding: '12px 26px',
              fontSize: '15px',
              borderRadius: '8px',
              backgroundColor: 'white',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            Browse jobs
          </button>
        </div>


        {/* Embedded styling for Hero Stack layout responsiveness */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .hero-stack-section h1 {
              font-size: 34px !important;
            }
            .hero-illustration-parallax {
              height: 380px !important;
            }
            .hero-main-character {
              max-width: 240px !important;
            }
            .floating-card {
              scale: 0.82;
            }
            .floating-card:nth-of-type(1) {
              top: 5% !important;
              left: -5% !important;
            }
            .floating-card:nth-of-type(2) {
              bottom: 2% !important;
              left: -8% !important;
              width: 140px !important;
            }
            .floating-card:nth-of-type(3) {
              top: 10% !important;
              right: -5% !important;
            }
            .floating-card:nth-of-type(4) {
              bottom: 2% !important;
              right: -8% !important;
              width: 150px !important;
            }
            .hero-search-bar {
              flex-direction: column !important;
              border-radius: 24px !important;
              padding: 16px !important;
              gap: 12px !important;
            }
            .hero-search-bar input {
              width: 100% !important;
              padding: 6px 0 !important;
              text-align: center !important;
            }
            .hero-search-bar select {
              width: 100% !important;
              padding: 6px 0 !important;
              text-align: center !important;
            }
            .hero-search-bar div {
              display: none !important;
            }
            .hero-search-btn {
              width: 100% !important;
              border-radius: 20px !important;
              height: 40px !important;
            }
          }
          .founder-image-wrapper {
            flex: 0 0 100%;
            max-width: 100%;
          }
          @media (min-width: 768px) {
            .founder-image-wrapper {
              flex: 0 0 250px !important;
              max-width: 250px !important;
            }
          }
        `}} />
      </section>

      {/* 2. Designed for Designers Track Section (Screenshot 2 alignment) */}
      <section style={{
        padding: '50px 0',
        borderTop: '1px solid var(--border-color)',
        marginBottom: '40px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{
            color: 'var(--accent)',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '8px'
          }}>
            Three Tracks. Zero Noise.
          </span>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '800',
            fontFamily: 'var(--font-family-display)',
            color: '#1d2226'
          }}>
            Designed for designers — not generalists.
          </h2>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px'
        }} className="tracks-grid">
          {/* Card 1: Graphic Designer */}
          <div className="card" style={{
            padding: '40px 30px',
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '20px'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              backgroundColor: '#e8f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Palette size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1d2226' }}>Graphic Designer</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Fresher only • 0-12 months</p>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {['Photoshop', 'Illustrator', 'CorelDRAW', 'Canva', 'Figma', 'InDesign'].map((tag) => (
                <span key={tag} style={{
                  padding: '6px 14px',
                  backgroundColor: '#e8f3ff',
                  color: 'var(--primary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* Card 2: UI/UX Designer */}
          <div className="card" style={{
            padding: '40px 30px',
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '20px'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <Sparkles size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1d2226' }}>UI/UX Designer • AI</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Fresher only • 0-12 months</p>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {['Figma', 'Adobe XD', 'Framer', 'Midjourney', 'ChatGPT', 'Adobe Firefly'].map((tag) => (
                <span key={tag} style={{
                  padding: '6px 14px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Card 3: Motion Graphic Designer */}
          <div className="card" style={{
            padding: '40px 30px',
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '20px'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              backgroundColor: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ea580c'
            }}>
              <Laptop size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1d2226' }}>Motion Graphic Designer</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Fresher only • 0-12 months</p>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {['After Effects', 'Premiere Pro', 'Cinema 4D', 'Blender', 'Maya', 'Figma'].map((tag) => (
                <span key={tag} style={{
                  padding: '6px 14px',
                  backgroundColor: '#fff7ed',
                  color: '#ea580c',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Hire Faster. Hire Fresher Section (Screenshot 3 alignment) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        alignItems: 'center',
        padding: '50px 0',
        borderTop: '1px solid var(--border-color)',
        marginBottom: '40px'
      }} className="benefits-grid-section">
        {/* Left Column: Copy & Checklist */}
        <div>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '800',
            fontFamily: 'var(--font-family-display)',
            color: '#1d2226',
            marginBottom: '16px'
          }}>
            Hire faster. Hire fresher.
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-muted)',
            lineHeight: '1.6',
            marginBottom: '24px'
          }}>
            Post a role in under 2 minutes. Set vacancies and we'll automatically close the listing once you receive enough quality applications.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {[
              "Auto-close listings on vacancy fill",
              "Built-in candidate profiles with portfolios",
              "Accept / Reject with one click + auto emails"
            ].map((text) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0
                }}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>{text}</span>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => navigate('/auth?signup=true')}
            className="btn btn-accent" 
            style={{
              backgroundColor: '#059669',
              color: 'white',
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: '700',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Briefcase size={16} /> Start hiring
          </button>
        </div>
        
        {/* Right Column: Abstract Green/Blue twirl */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            height: '350px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)'
          }}>
            {/* Spinning/Abstract twirl graphic */}
            <div style={{
              position: 'relative',
              width: '220px',
              height: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Petal 1 */}
              <div style={{
                position: 'absolute',
                width: '140px',
                height: '140px',
                borderRadius: '50% 0 50% 50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                opacity: 0.85,
                transform: 'rotate(45deg)',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)'
              }}></div>
              {/* Petal 2 */}
              <div style={{
                position: 'absolute',
                width: '140px',
                height: '140px',
                borderRadius: '0 50% 50% 50%',
                background: 'linear-gradient(135deg, #0a66c2 0%, #004182 100%)',
                opacity: 0.85,
                transform: 'rotate(-45deg)',
                boxShadow: '0 8px 20px rgba(10, 102, 194, 0.2)'
              }}></div>
              
              <div style={{
                position: 'relative',
                zIndex: 2,
                color: 'white',
                fontFamily: 'var(--font-family-display)',
                fontWeight: '800',
                fontSize: '18px',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                ABSTRACT<br />BACKGROUND
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Spotlight Card (User's Image) */}
      <section className="card" style={{
        padding: '30px',
        marginBottom: '40px',
        borderLeft: '5px solid var(--accent)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '30px'
        }}>
          {/* Suryansh Image Display */}
          <div className="founder-image-wrapper">
            <img 
              src={suryanshImg} 
              alt="Suryansh - Founder" 
              style={{
                width: '100%',
                maxHeight: '180px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                border: '2px solid var(--border-color)'
              }}
            />
          </div>
          
          <div style={{ flex: '1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-primary">Founder Spotlight</span>
            </div>
            <h2 style={{ fontSize: '26px', color: 'var(--primary)', marginBottom: '8px' }}>Suryansh</h2>
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '12px', fontSize: '15px' }}>
              "We believe fresh minds with AI tools experience bring the most disruptive ideas. JJ Just Job exists to bridge the gap between fresh designers and modern hiring pipelines, with zero complexities."
            </p>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-light)' }}>
              <div>🏢 Suryansh Tech Studio</div>
              <div>✉️ <a href="mailto:usuryansh0311@gmail.com">usuryansh0311@gmail.com</a></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Jobs Listing Section (Indeed Layout + LinkedIn side-by-side) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        gap: '12px' 
      }} id="jobs-section">
        <h2 style={{ fontSize: '24px', color: 'var(--text-main)', margin: 0 }}>
          Explore Fresh Job Openings ({filteredJobs.length})
        </h2>
        { (roleFilter !== 'All' || searchQuery) && (
          <button 
            onClick={() => { setRoleFilter('All'); setSearchQuery(''); }}
            className="btn btn-secondary" 
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '20px' }}
          >
            Clear Filters & Search
          </button>
        ) }
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Loading job listings...</div>
        </div>
      ) : error ? (
        <div className="card" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '20px', textAlign: 'center' }}>
          {error}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="card" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h3>No jobs found matching your filters.</h3>
          <p>Please check back later or modify your search tags.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.8fr',
          gap: '24px'
        }} className="jobs-layout-grid">
          
          {/* Left Column: Job Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '8px' }} className="jobs-list-pane">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                onClick={() => {
                  setSelectedJob(job);
                  setMobileView('details');
                }}
                className="card"
                style={{
                  padding: '20px',
                  cursor: 'pointer',
                  borderLeft: selectedJob && selectedJob._id === job._id ? '4px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: selectedJob && selectedJob._id === job._id ? 'var(--primary-light)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="badge badge-primary" style={{ fontSize: '11px' }}>{job.role}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '6px' }}>{job.title}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ color: 'var(--accent)' }} />
                    {job.location}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--success)' }}>
                    <DollarSign size={14} />
                    ₹{job.salary.toLocaleString()}/month
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} />
                    Fresher ({job.experienceValue} {job.experienceType} required)
                  </div>
                </div>

                {/* Required Tools tags */}
                <div className="tag-list" style={{ marginTop: '8px' }}>
                  {job.tools.slice(0, 4).map((tool, index) => (
                    <span key={index} className="tag" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {tool}
                    </span>
                  ))}
                  {job.tools.length > 4 && (
                    <span className="tag" style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: 'transparent', border: '1px dashed #bbb' }}>
                      +{job.tools.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ position: 'sticky', top: '90px', alignSelf: 'start' }} className="job-details-pane">
            {selectedJob ? (
              <div className="card" style={{ padding: '30px', borderTop: '4px solid var(--accent)' }}>
                {/* Back button visible only on mobile */}
                <button
                  onClick={() => setMobileView('list')}
                  className="btn btn-secondary mobile-back-btn"
                  style={{
                    marginBottom: '15px',
                    display: 'none',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    borderRadius: '20px',
                    width: 'fit-content'
                  }}
                >
                  ← Back to Job Listings
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-success">{selectedJob.role}</span>
                      {selectedJob.jobType && (
                        <span className="badge badge-primary" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>{selectedJob.jobType}</span>
                      )}
                    </div>
                    <h2 style={{ fontSize: '26px', color: 'var(--text-main)', marginBottom: '4px' }}>{selectedJob.title}</h2>
                    <h3 style={{ fontSize: '16px', color: 'var(--accent)', fontWeight: '600', marginBottom: '8px' }}>
                      {selectedJob.companyName || 'Acme Studio'}
                    </h3>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={15} style={{ color: 'var(--accent)' }} />
                        {selectedJob.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: 'bold' }}>
                        <DollarSign size={15} />
                        ₹{selectedJob.salary.toLocaleString()}/month
                      </span>
                    </div>
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />

                {/* Quick Info Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                  backgroundColor: 'var(--primary-light)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Vacancies</span>
                    <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>{selectedJob.vacancies} open slots</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Experience Required</span>
                    <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>
                      {selectedJob.experienceValue} {selectedJob.experienceType}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Contact Recruiter</span>
                    {selectedJob.hrEmail === 'no mail' ? (
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block' }}>
                        no mail
                      </span>
                    ) : (
                      <a href={`mailto:${selectedJob.hrEmail}`} style={{ fontSize: '14px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {selectedJob.hrEmail}
                      </a>
                    )}
                  </div>
                </div>

                {/* Requirements / Tools */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Laptop size={16} style={{ color: 'var(--accent)' }} />
                    Required Tools & Software:
                  </h4>
                  <div className="tag-list">
                    {selectedJob.tools.map((tool, index) => (
                      <span key={index} className="tag" style={{ backgroundColor: 'white', border: '1.5px solid var(--border-color)', color: 'var(--accent)' }}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Company Description */}
                {selectedJob.companyDescription && (
                  <div style={{ marginBottom: '24px', padding: '14px 18px', backgroundColor: '#fafbfc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>About Company:</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                      {selectedJob.companyDescription}
                    </p>
                  </div>
                )}

                {/* Job Description */}
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '10px' }}>Role Description & Responsibilities:</h4>
                  <p style={{
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-line',
                    fontSize: '15px',
                    lineHeight: '1.6'
                  }}>
                    {selectedJob.description}
                  </p>
                </div>

                {/* Apply Button & Messaging */}
                <div>
                  <button
                    onClick={() => handleApply(selectedJob._id)}
                    disabled={applyLoading || selectedJob.status !== 'open'}
                    className={`btn btn-accent`}
                    style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                  >
                    {applyLoading ? 'Submitting Application...' : selectedJob.status === 'open' ? 'Apply to this Job Instantly' : 'Applications Closed'}
                  </button>

                  {applyMessage.text && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '14px',
                      textAlign: 'center',
                      backgroundColor: applyMessage.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
                      color: applyMessage.type === 'success' ? 'var(--success)' : 'var(--error)',
                      border: `1px solid ${applyMessage.type === 'success' ? 'var(--success)' : 'var(--error)'}`
                    }}>
                      {applyMessage.text}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
                No job selected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embedded CSS for layout responsiveness */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .jobs-layout-grid {
            grid-template-columns: 1fr !important;
          }
          .job-details-pane {
            position: static !important;
            margin-top: 20px;
            display: ${mobileView === 'details' ? 'block' : 'none'} !important;
          }
          .jobs-list-pane {
            display: ${mobileView === 'list' ? 'flex' : 'none'} !important;
          }
          .mobile-back-btn {
            display: inline-flex !important;
          }
        }
        @media (max-width: 768px) {
          .hero-banner {
            padding: 30px 20px !important;
          }
          .hero-banner h1 {
            font-size: 28px !important;
          }
          .founder-image-wrapper {
            max-width: 100% !important;
            flex: 0 0 100% !important;
          }
        }
      `}} />
    </div>
  );
};

export default Landing;
