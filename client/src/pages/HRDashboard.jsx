import React, { useState, useEffect } from 'react';
import { PlusCircle, Users, MapPin, DollarSign, Calendar, Mail, FileText, Check, X, Trash2, Eye, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HRDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [mobileView, setMobileView] = useState('jobs'); // 'jobs' or 'applicants'
  const [applicantSearch, setApplicantSearch] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  // Job post pane & form states
  const [showPostForm, setShowPostForm] = useState(false);
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [jobType, setJobType] = useState('Remote');
  const [role, setRole] = useState('Graphic Designer');
  const [experienceType, setExperienceType] = useState('months');
  const [experienceValue, setExperienceValue] = useState(0);
  const [selectedTools, setSelectedTools] = useState([]);
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState(12000);
  const [location, setLocation] = useState('');
  const [vacancies, setVacancies] = useState(1);
  const [hrEmail, setHrEmail] = useState(user?.email || '');

  // Form notifications
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Candidate review detail overlay modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Tools definitions
  const graphicTools = ['Photoshop', 'Illustrator', 'CorelDRAW', 'Canva', 'Figma'];
  const uiuxTools = ['Figma', 'Adobe XD', 'Framer', 'Midjourney', 'ChatGPT', 'Runway', 'Adobe Firefly'];
  const motionTools = ['After Effects', 'Premiere Pro', 'Cinema 4D', 'Blender', 'Maya', 'Figma'];

  useEffect(() => {
    fetchRecruiterJobs();
    if (user && user.email) {
      setHrEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (selectedJob) {
      fetchApplicants(selectedJob._id);
    } else {
      setApplicants([]);
    }
  }, [selectedJob]);

  const fetchRecruiterJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await fetch('/api/jobs/my-postings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setJobs(json.data);
        if (json.data.length > 0) {
          if (!selectedJob) {
            setSelectedJob(json.data[0]);
          }
        } else {
          setShowPostForm(true);
          setSelectedJob(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      setLoadingApplicants(true);
      const res = await fetch(`/api/applications/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setApplicants(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleToolToggle = (tool) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter(t => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  // Adjust tools when role drops
  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setSelectedTools([]);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validations
    if (Number(salary) < 12000) {
      setFormError('Salary must be at least ₹12,000/month.');
      return;
    }

    const expVal = Number(experienceValue);
    if (experienceType === 'months') {
      if (expVal < 0 || expVal > 11) {
        setFormError('Experience in months must be between 0 and 11.');
        return;
      }
    } else {
      if (expVal < 0 || expVal > 1) {
        setFormError('Experience in years must be 0 or 1.');
        return;
      }
    }

    if (selectedTools.length === 0) {
      setFormError('Please select at least one software/tool.');
      return;
    }

    try {
      setFormLoading(true);
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title,
          companyName,
          companyDescription,
          jobType,
          role,
          experienceType,
          experienceValue: expVal,
          tools: selectedTools,
          description,
          salary: Number(salary),
          location,
          vacancies: Number(vacancies),
          hrEmail
        })
      });

      const json = await res.json();
      if (json.success) {
        setFormSuccess('Job posted successfully! Redirecting...');
        // Reset form
        setTitle('');
        setCompanyName('');
        setCompanyDescription('');
        setJobType('Remote');
        setRole('Graphic Designer');
        setExperienceType('months');
        setExperienceValue(0);
        setSelectedTools([]);
        setDescription('');
        setSalary(12000);
        setLocation('');
        setVacancies(1);
        setHrEmail(user ? user.email : '');
        
        // Refresh list
        setSelectedJob(null);
        fetchRecruiterJobs();
        setTimeout(() => {
          setShowPostForm(false);
          setFormSuccess('');
          navigate('/');
        }, 1500);
      } else {
        setFormError(json.message || 'Failed to post job');
      }
    } catch (err) {
      setFormError('Connection error.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        // Refresh lists
        fetchApplicants(selectedJob._id);
        fetchRecruiterJobs();
        setSelectedCandidate(null);
      } else {
        alert(json.message || 'Failed to update candidate status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to remove this applicant from the review panel?')) return;
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        fetchApplicants(selectedJob._id);
        fetchRecruiterJobs();
        setSelectedCandidate(null);
      } else {
        alert(json.message || 'Failed to remove candidate');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteListing = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job listing? This will also remove all associated application data.')) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setSelectedJob(null);
        fetchRecruiterJobs();
      } else {
        alert(json.message || 'Failed to delete listing');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleJobStatus = async (jobId, currentStatus) => {
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const json = await res.json();
      if (json.success) {
        fetchRecruiterJobs();
        setSelectedJob(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResumeJob = async (jobId) => {
    try {
      const res = await fetch(`/api/applications/resume-job/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || 'Job listing resumed successfully');
        fetchRecruiterJobs();
        if (json.data) {
          setSelectedJob(json.data);
        }
      } else {
        alert(json.message || 'Failed to resume listing');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error.');
    }
  };

  const filteredApplicants = applicants.filter((app) => {
    const prof = app.profile;
    if (!prof) return false;
    
    const searchLower = applicantSearch.toLowerCase().trim();
    if (!searchLower) return true;
    
    const nameMatch = prof.fullName && prof.fullName.toLowerCase().includes(searchLower);
    const emailMatch = prof.gmail && prof.gmail.toLowerCase().includes(searchLower);
    const toolsMatch = Array.isArray(prof.tools) && prof.tools.some(t => t.toLowerCase().includes(searchLower));
    const skillsMatch = Array.isArray(prof.skills) && prof.skills.some(s => s.toLowerCase().includes(searchLower));
    
    return nameMatch || emailMatch || toolsMatch || skillsMatch;
  });

  const toolsList = 
    role === 'Graphic Designer' 
      ? graphicTools 
      : role === 'Motion Graphic Designer' 
      ? motionTools 
      : uiuxTools;

  return (
    <div className="container animate-fade-in" style={{ padding: '20px 0', minHeight: '80vh' }}>
      
      {/* Dashboard Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', color: 'var(--text-main)', fontFamily: 'var(--font-family-display)' }}>HR Recruitment Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Post new fresher openings, track vacancies, and manage applicant statuses.</p>
        </div>
        <button
          onClick={() => {
            if (user) setHrEmail(user.email);
            setSelectedJob(null);
            setShowPostForm(true);
            setFormError('');
            setFormSuccess('');
            setMobileView('applicants');
          }}
          className="btn btn-accent"
          style={{ padding: '12px 24px' }}
        >
          <PlusCircle size={18} /> Post a Design Job
        </button>
      </div>

      {/* Recruiter Metrics Header Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Posted Jobs</span>
          <strong style={{ fontSize: '24px', color: 'var(--text-main)' }}>{jobs.length} Listings</strong>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--success)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Openings</span>
          <strong style={{ fontSize: '24px', color: 'var(--success)' }}>{jobs.filter(j => j.status === 'open').length} Open</strong>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--error)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Closed Listings</span>
          <strong style={{ fontSize: '24px', color: 'var(--error)' }}>{jobs.filter(j => j.status === 'closed').length} Closed</strong>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--warning)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Vacancies</span>
          <strong style={{ fontSize: '24px', color: 'var(--warning)' }}>{jobs.reduce((sum, j) => sum + j.vacancies, 0)} Slots</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '24px' }} className="hr-layout-grid">
        
        {/* Left Column: Job Postings List */}
        <div className="hr-jobs-pane">
          <h2 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} style={{ color: 'var(--primary)' }} />
            Your Posted Openings ({jobs.length})
          </h2>

          {loadingJobs ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>Loading job postings...</div>
          ) : jobs.length === 0 ? (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
              No listings posted yet. Click "Post a Design Job" to get started!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {jobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => {
                    setSelectedJob(job);
                    setShowPostForm(false);
                    setMobileView('applicants');
                  }}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderLeft: selectedJob && selectedJob._id === job._id ? '4px solid var(--accent)' : '1px solid var(--border-color)',
                    backgroundColor: selectedJob && selectedJob._id === job._id ? 'var(--primary-light)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '10px' }}>{job.role}</span>
                    <span className={`badge ${job.status === 'open' ? 'badge-success' : job.status === 'paused' ? 'badge-warning' : 'badge-error'}`} style={{ fontSize: '10px' }}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '4px' }}>{job.title}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: 'var(--text-light)' }}>
                    <span>📍 {job.location}</span>
                    <span>💰 ₹{job.salary.toLocaleString()}</span>
                    <span>👥 Slots: {job.vacancies}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hr-applicants-pane">
          {showPostForm ? (
            <div className="card" style={{ borderTop: '4px solid var(--accent)', minHeight: '60vh', padding: '30px' }}>
              
              {/* Back button visible only on mobile */}
              <button
                onClick={() => setMobileView('jobs')}
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
                ← Back to Posted Jobs
              </button>

              <h2 style={{ fontSize: '24px', color: 'var(--text-main)', marginBottom: '6px' }}>Post a New Job Listing</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Fill in details to recruit design freshers with specific AI toolsets.</p>

              {formError && (
                <div className="card" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '12px 16px', marginBottom: '20px', border: '1px solid var(--error)' }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="card" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '12px 16px', marginBottom: '20px', border: '1px solid var(--success)' }}>
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handlePostJob}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="form-grid-2">
                  
                  {/* Title */}
                  <div className="form-group">
                    <label className="form-label">Position / Designation Title</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Junior UI/UX Designer"
                    />
                  </div>

                  {/* Role */}
                  <div className="form-group">
                    <label className="form-label">Job Role Category</label>
                    <select className="form-control" value={role} onChange={handleRoleChange}>
                      <option value="Graphic Designer">Graphic Designer</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="Motion Graphic Designer">Motion Graphic Designer</option>
                    </select>
                  </div>

                  {/* Company Name */}
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Studio"
                    />
                  </div>

                  {/* Job Type */}
                  <div className="form-group">
                    <label className="form-label">Job Type</label>
                    <select
                      className="form-control"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                    >
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  {/* Company Description */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Company Description</label>
                    <textarea
                      required
                      rows={2}
                      className="form-control"
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      placeholder="e.g. A creative digital design agency building premium user interfaces..."
                    />
                  </div>

                  {/* Experience Required */}
                  <div className="form-group">
                    <label className="form-label">Experience Required (Fresher Bounds)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="number"
                        required
                        min={0}
                        max={experienceType === 'months' ? 11 : 1}
                        className="form-control"
                        style={{ flex: 1 }}
                        value={experienceValue}
                        onChange={(e) => setExperienceValue(Number(e.target.value))}
                      />
                      <select
                        className="form-control"
                        style={{ flex: 1 }}
                        value={experienceType}
                        onChange={(e) => {
                          setExperienceType(e.target.value);
                          setExperienceValue(0);
                        }}
                      >
                        <option value="months">Months (0-11)</option>
                        <option value="years">Years (0-1)</option>
                      </select>
                    </div>
                  </div>

                  {/* Monthly Salary */}
                  <div className="form-group">
                    <label className="form-label">Monthly Salary (INR)</label>
                    <input
                      type="number"
                      required
                      min={12000}
                      className="form-control"
                      value={salary}
                      onChange={(e) => setSalary(Number(e.target.value))}
                      placeholder="Min 12000"
                    />
                    <small style={{ color: 'var(--text-light)' }}>Minimum ₹12,000/month is strictly enforced.</small>
                  </div>

                  {/* Location */}
                  <div className="form-group">
                    <label className="form-label">Location / Area</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Remote / Bangalore"
                    />
                  </div>

                  {/* Vacancies */}
                  <div className="form-group">
                    <label className="form-label">Number of Vacancies</label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="form-control"
                      value={vacancies}
                      onChange={(e) => setVacancies(Number(e.target.value))}
                    />
                  </div>

                  {/* HR Email */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">HR Contact Email (For Alerts & Inquiries)</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={hrEmail}
                      onChange={(e) => setHrEmail(e.target.value)}
                      placeholder="hr@company.com or 'no mail'"
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Role Description</label>
                    <textarea
                      required
                      rows={4}
                      className="form-control"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detail the role responsibilities, working hours, and expectations..."
                    />
                  </div>

                  {/* Software Tools Required */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Specific Software/Tools Needed (Checkboxes)</label>
                    <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '10px' }}>
                      {toolsList.map((tool) => (
                        <label key={tool} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                          <input
                            type="checkbox"
                            className="checkbox-input"
                            checked={selectedTools.includes(tool)}
                            onChange={() => handleToolToggle(tool)}
                          />
                          {tool}
                        </label>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  {jobs.length > 0 && (
                    <button type="button" onClick={() => {
                      setShowPostForm(false);
                      setSelectedJob(jobs[0]);
                    }} className="btn btn-secondary">
                      Cancel
                    </button>
                  )}
                  <button type="submit" disabled={formLoading} className="btn btn-primary">
                    {formLoading ? 'Posting...' : 'Publish Job'}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedJob ? (
            <div className="card" style={{ borderTop: '4px solid var(--primary)', minHeight: '60vh' }}>
              {/* Back button visible only on mobile */}
              <button
                onClick={() => setMobileView('jobs')}
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
                ← Back to Posted Jobs
              </button>
              
              {/* Job Stats Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '20px',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <span className="badge badge-success" style={{ marginBottom: '6px' }}>{selectedJob.role}</span>
                  <h2 style={{ fontSize: '22px', color: 'var(--text-main)', marginBottom: '4px' }}>{selectedJob.title}</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Experience Required: {selectedJob.experienceValue} {selectedJob.experienceType} | Location: {selectedJob.location}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Status Toggle (Open/Close) */}
                  <button
                    onClick={() => toggleJobStatus(selectedJob._id, selectedJob.status)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    {selectedJob.status === 'open' ? 'Close Listing' : 'Reopen Listing'}
                  </button>
                  {/* Delete Listing Button */}
                  <button
                    onClick={() => handleDeleteListing(selectedJob._id)}
                    className="btn btn-danger"
                    style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>

              {selectedJob.status === 'paused' && (
                <div className="card animate-fade-in" style={{
                  backgroundColor: 'var(--warning-bg)',
                  border: '1px solid var(--warning)',
                  color: 'var(--warning)',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ flex: '1', minWidth: '250px' }}>
                    <strong style={{ display: 'block', fontSize: '15px', color: 'var(--warning)', marginBottom: '4px' }}>
                      ⚠️ Job Paused (Vacancy limit met)
                    </strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Applications have paused because the vacancy limit was met. Review candidates below. If slots are still available, you can resume the listing.
                    </span>
                  </div>
                  <button
                    onClick={() => handleResumeJob(selectedJob._id)}
                    className="btn btn-accent"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Resume Listing
                  </button>
                </div>
              )}

              {/* Applicants list for selected job */}
              <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '16px' }}>
                Applications Received ({applicants.length} of {selectedJob.vacancies} vacancies)
              </h3>

              {/* Search Bar */}
              {applicants.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search candidates by name, tools (e.g. Figma, Canva) or skills..."
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    className="form-control"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}

              {loadingApplicants ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading candidates...</div>
              ) : applicants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-light)' }}>
                  No candidates have applied to this listing yet.
                </div>
              ) : filteredApplicants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No candidates matched your search "{applicantSearch}".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredApplicants.map((app) => {
                    const prof = app.profile;
                    if (!prof) return null;
                    return (
                      <div
                        key={app._id}
                        className="card"
                        style={{
                          padding: '20px',
                          backgroundColor: '#fafbfc',
                          border: '1px solid var(--border-color)',
                          transition: 'var(--transition)'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                          
                          {/* Candidate Image */}
                          <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary)', flex: '0 0 60px' }}>
                            <img src={prof.photoUrl} alt={prof.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>

                          <div style={{ flex: '1', minWidth: '200px' }}>
                            <h4 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '2px' }}>{prof.fullName}</h4>
                            <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-light)', flexWrap: 'wrap' }}>
                              <span>👥 Exp: {prof.experienceValue} {prof.experienceType}</span>
                              <span>✉️ {prof.gmail}</span>
                            </div>
                            
                            {/* Skills Tags */}
                            <div className="tag-list" style={{ marginTop: '8px' }}>
                              {prof.tools.map((tool, index) => (
                                <span key={index} className="badge" style={{ backgroundColor: 'white', border: '1px solid #ddd', color: 'var(--accent)', fontSize: '10px', padding: '2px 6px' }}>
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* App Status & Details trigger */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {app.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleStatusUpdate(app._id, 'cracked')}
                                  title="Accept Candidate"
                                  className="btn btn-primary"
                                  style={{ padding: '8px', borderRadius: '50%' }}
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(app._id, 'rejected')}
                                  title="Reject Candidate"
                                  className="btn btn-danger"
                                  style={{ padding: '8px', borderRadius: '50%' }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <span className={`badge ${app.status === 'cracked' ? 'badge-success' : 'badge-error'}`} style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold' }}>
                                {app.status}
                              </span>
                            )}
                            <button
                              onClick={() => setSelectedCandidate(app)}
                              className="btn btn-secondary"
                              style={{ padding: '8px 12px', fontSize: '11px' }}
                            >
                              <Eye size={12} /> View Profile
                            </button>
                            <button
                              onClick={() => handleDeleteApplication(app._id)}
                              title="Delete candidate application"
                              style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            <div className="card" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-light)', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <HelpCircle size={40} style={{ color: 'var(--border-color)', marginBottom: '12px' }} />
              <h3>No Listing Selected</h3>
              <p>Select a job listing from the left pane to view applications.</p>
            </div>
          )}
        </div>

      </div>

      {/* 1. Candidate Full Review Overlay Modal */}
      {selectedCandidate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '20px'
        }} onClick={() => setSelectedCandidate(null)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '30px',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedCandidate(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            {/* Candidate Header */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent)' }}>
                <img src={selectedCandidate.profile.photoUrl} alt={selectedCandidate.profile.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <span className="badge badge-primary">{selectedCandidate.profile.position}</span>
                <h2 style={{ fontSize: '24px', color: 'var(--text-main)', marginTop: '4px' }}>{selectedCandidate.profile.fullName}</h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span>Exp: {selectedCandidate.profile.experienceValue} {selectedCandidate.profile.experienceType}</span>
                  <span>Languages: {selectedCandidate.profile.languages.join(', ')}</span>
                </div>
              </div>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />

            {/* Profile Detail Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }} className="modal-details-grid">
              <div>
                <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Gmail Address</strong>
                <a href={`mailto:${selectedCandidate.profile.gmail}`} style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedCandidate.profile.gmail}</a>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Portfolio Link</strong>
                {selectedCandidate.profile.portfolioUrl ? (
                  <a href={selectedCandidate.profile.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                    View Portfolio Website <ExternalLink size={12} />
                  </a>
                ) : <span style={{ fontSize: '14px' }}>Not Provided</span>}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '6px' }}>Skills Tags</strong>
                <div className="tag-list">
                  {selectedCandidate.profile.skills.map((s, i) => (
                    <span key={i} className="tag" style={{ fontSize: '12px' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '6px' }}>Software & Tools Known</strong>
                <div className="tag-list">
                  {selectedCandidate.profile.tools.map((t, i) => (
                    <span key={i} className="badge badge-primary" style={{ fontWeight: 'bold' }}>{t}</span>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Schooling / Education Details</strong>
                <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>
                  {selectedCandidate.profile.schooling || 'Not Provided'}
                </span>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Resume Download</strong>
                <a href={selectedCandidate.profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '13px' }}>
                  <FileText size={14} /> Open Candidate Resume (PDF)
                </a>
              </div>
            </div>

            {/* Candidate Work Experiences */}
            {selectedCandidate.profile.workExperience && selectedCandidate.profile.workExperience.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '12px' }}>Work Experience</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedCandidate.profile.workExperience.map((exp, idx) => (
                    <div key={idx} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fafbfc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                        <div>
                          <h4 style={{ fontSize: '15px', color: 'var(--text-main)', margin: 0, fontWeight: 'bold' }}>{exp.role}</h4>
                          <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>{exp.company}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', backgroundColor: '#eef2f6', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                          {exp.fromMonth}/{exp.fromYear} – {exp.toMonth}/{exp.toYear}
                        </span>
                      </div>
                      {exp.description && (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 0 0', lineHeight: '1.4' }}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Candidate Work Samples Carousel/Grid */}
            <div style={{ marginBottom: '30px' }}>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '10px' }}>Best 3 Work Samples (Click to Zoom)</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {selectedCandidate.profile.workSamples.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setLightboxImage(img)}
                    style={{ 
                      aspectRatio: '4/3', 
                      borderRadius: 'var(--radius-sm)', 
                      overflow: 'hidden', 
                      border: '1px solid var(--border-color)', 
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    className="portfolio-thumb"
                  >
                    <img src={img} alt={`Work sample ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div className="zoom-overlay" style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.3)',
                      opacity: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      transition: 'var(--transition)'
                    }}>
                      🔍 View Large
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accept / Reject actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {selectedCandidate.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedCandidate._id, 'rejected')}
                    className="btn btn-danger"
                    style={{ padding: '10px 20px' }}
                  >
                    Reject Candidate
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedCandidate._id, 'cracked')}
                    className="btn btn-primary"
                    style={{ padding: '10px 25px' }}
                  >
                    Accept Candidate (Cracked)
                  </button>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: selectedCandidate.status === 'cracked' ? 'var(--success-bg)' : 'var(--error-bg)',
                  color: selectedCandidate.status === 'cracked' ? 'var(--success)' : 'var(--error)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 'bold'
                }}>
                  <ShieldCheck size={16} /> Status: {selectedCandidate.status.toUpperCase()}
                </div>
              )}
            </div>

          </div>
        </div>
      )}



      {/* Visual Lightbox Overlay */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImage} 
              alt="Zoomed Work Sample" 
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', objectFit: 'contain' }} 
            />
            <button 
              onClick={() => setLightboxImage(null)}
              className="btn btn-secondary"
              style={{
                position: 'absolute',
                top: '-50px',
                right: '0',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px'
              }}
            >
              ✕ Close Zoom
            </button>
          </div>
        </div>
      )}

      {/* Embedded CSS for split pane layout responsiveness */}
      <style dangerouslySetInnerHTML={{__html: `
        .portfolio-thumb:hover .zoom-overlay {
          opacity: 1 !important;
        }
        @media (max-width: 800px) {
          .hr-layout-grid {
            grid-template-columns: 1fr !important;
          }
          .hr-jobs-pane {
            display: ${mobileView === 'jobs' ? 'block' : 'none'} !important;
          }
          .hr-applicants-pane {
            display: ${mobileView === 'applicants' ? 'block' : 'none'} !important;
            position: static !important;
          }
          .mobile-back-btn {
            display: inline-flex !important;
          }
          .modal-details-grid {
            grid-template-columns: 1fr !important;
          }
          .modal-details-grid > div {
            grid-column: span 1 !important;
          }
        }
      `}} />
    </div>
  );
};

export default HRDashboard;
