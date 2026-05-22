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

  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

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

  return (
    <div className="container animate-fade-in" style={{ minHeight: '80vh' }}>
      
      {/* 1. Hero Grid Section (Screenshot 1 alignment) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '40px',
        alignItems: 'center',
        padding: '50px 0',
        marginBottom: '40px'
      }} className="hero-grid-section">
        {/* Left Column: Badges, Headings, Buttons, Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
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
            marginBottom: '20px'
          }}>
            <Sparkles size={13} style={{ fill: '#059669' }} /> Built for fresher designers • 0-12 months
          </div>
          
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            lineHeight: '1.15',
            color: '#1d2226',
            fontFamily: 'var(--font-family-display)',
            marginBottom: '20px',
            letterSpacing: '-1px'
          }}>
            Land your first <span style={{ color: 'var(--primary)' }}>design job</span>.<br />
            Hire your next <span style={{ color: 'var(--primary)' }}>creative</span>.
          </h1>
          
          <p style={{
            fontSize: '17px',
            color: 'var(--text-muted)',
            lineHeight: '1.6',
            marginBottom: '32px',
            maxWidth: '560px'
          }}>
            JJ Just Job is a focused portal where <strong>Graphic Designers</strong>, <strong>Motion Graphic Designers</strong>, and <strong>UI/UX Designers</strong> with AI-tool experience meet hiring managers — without the noise.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}>
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
          
          {/* Hero Stats */}
          <div style={{
            display: 'flex',
            gap: '40px',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '24px',
            width: '100%'
          }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#1d2226', fontFamily: 'var(--font-family-display)' }}>₹12,000+</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>Avg. Min. Salary</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#1d2226', fontFamily: 'var(--font-family-display)' }}>3 tracks</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>Designer roles only</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#1d2226', fontFamily: 'var(--font-family-display)' }}>12+</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>AI tools tracked</div>
            </div>
          </div>
        </div>
        
        {/* Right Column: Illustration with Floating overlay card */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="hero-illustration-container">
          <div style={{
            width: '100%',
            maxWidth: '460px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            padding: '20px'
          }}>
            <img 
              src={heroImg} 
              alt="Design Desk Illustration" 
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--radius-md)' }} 
            />
          </div>
          
          {/* Floating Application Received Card */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '-20px',
            backgroundColor: 'white',
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10,
            animation: 'float 4s ease-in-out infinite'
          }} className="floating-card">
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0
            }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1d2226' }}>Application received</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>UI/UX Designer • Bengaluru</div>
            </div>
          </div>
        </div>
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
          <div style={{
            flex: '0 0 100%',
            maxWidth: '100%',
            '@media (min-width: 768px)': {
              flex: '0 0 250px',
              maxWidth: '250px'
            }
          }} className="founder-image-wrapper">
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

      {/* Search and Filters Block */}
      <section style={{ marginBottom: '30px' }} id="jobs-section">
        <div className="card" style={{ padding: '20px' }}>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
              <Search size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)'
              }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search jobs by title, area, or tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['All', 'Graphic Designer', 'UI/UX Designer', 'Motion Graphic Designer'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`btn ${roleFilter === role ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 18px', fontSize: '14px' }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Jobs Listing Section (Indeed Layout + LinkedIn side-by-side) */}
      <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--text-main)' }}>
        Explore Fresh Job Openings ({filteredJobs.length})
      </h2>

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
                    <a href={`mailto:${selectedJob.hrEmail}`} style={{ fontSize: '14px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {selectedJob.hrEmail}
                    </a>
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
