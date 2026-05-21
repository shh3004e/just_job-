import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText, CheckCircle, Image, Globe, Plus, Trash2, Send, Clock, BookOpen, UserCheck, AlertTriangle } from 'lucide-react';

const SeekerDashboard = ({ user, profile, refreshMe }) => {
  const navigate = useNavigate();
  
  // States for applied jobs tracking
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  
  // Profile Editor states
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('Graphic Designer');
  const [experienceType, setExperienceType] = useState('months');
  const [experienceValue, setExperienceValue] = useState(0);
  const [skillsStr, setSkillsStr] = useState('');
  const [selectedTools, setSelectedTools] = useState([]);
  const [gmail, setGmail] = useState('');
  const [languagesStr, setLanguagesStr] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [schooling, setSchooling] = useState('');
  const [workExperience, setWorkExperience] = useState([]);
  
  // Upload files states
  const [resumeFile, setResumeFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [workSampleFiles, setWorkSampleFiles] = useState([]); // Array of 3 files
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  const calculateCompleteness = () => {
    let score = 0;
    if (fullName.trim()) score += 10;
    if (gmail.trim()) score += 10;
    if (skillsStr.trim()) score += 10;
    if (selectedTools.length > 0) score += 10;
    if (languagesStr.trim()) score += 10;
    if (schooling.trim()) score += 10;
    if (profile || resumeFile) score += 15;
    if (profile || photoFile) score += 15;
    if (profile || workSampleFiles.length === 3) score += 10;
    return Math.min(score, 100);
  };

  // Define tools lists
  const graphicTools = ['Photoshop', 'Illustrator', 'CorelDRAW', 'Canva', 'Figma'];
  const uiuxTools = ['Figma', 'Adobe XD', 'Framer', 'Midjourney', 'ChatGPT', 'Runway', 'Adobe Firefly'];
  const monthOptions = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const yearOptions = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027'];

  // Initialize fields with profile data if profile exists
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPosition(profile.position || 'Graphic Designer');
      setExperienceType(profile.experienceType || 'months');
      setExperienceValue(profile.experienceValue || 0);
      setSkillsStr(profile.skills ? profile.skills.join(', ') : '');
      setSelectedTools(profile.tools || []);
      setGmail(profile.gmail || '');
      setLanguagesStr(profile.languages ? profile.languages.join(', ') : '');
      setPortfolioUrl(profile.portfolioUrl || '');
      setSchooling(profile.schooling || '');
      setWorkExperience(profile.workExperience || []);
    } else {
      // Default email to user's registered email
      if (user) setGmail(user.email);
      setSchooling('');
      setWorkExperience([]);
    }
  }, [profile, user]);

  useEffect(() => {
    if (user && user.role === 'seeker') {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      const res = await fetch('/api/applications/my-applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setApplications(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleToolToggle = (tool) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter(t => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  // Adjust tools when position dropdown changes
  const handlePositionChange = (e) => {
    const pos = e.target.value;
    setPosition(pos);
    setSelectedTools([]); // clear tools to avoid invalid tools mismatch
  };

  const handleWorkSamplesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length !== 3) {
      setFormError('You must select exactly 3 portfolio images.');
      setWorkSampleFiles([]);
      return;
    }
    setFormError('');
    setWorkSampleFiles(files);
  };

  const handleAddExperience = () => {
    if (workExperience.length >= 3) {
      setFormError('You can add at most 3 work experiences.');
      return;
    }
    setFormError('');
    setWorkExperience([
      ...workExperience,
      {
        company: '',
        role: '',
        fromMonth: '01',
        fromYear: '2026',
        toMonth: '01',
        toYear: '2026',
        description: ''
      }
    ]);
  };

  const handleRemoveExperience = (index) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  const handleExperienceChange = (index, field, value) => {
    const updated = [...workExperience];
    updated[index][field] = value;
    setWorkExperience(updated);
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Val experience bounds
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

    if (!schooling.trim()) {
      setFormError('Please add your schooling/education details.');
      return;
    }

    for (let exp of workExperience) {
      if (!exp.company.trim() || !exp.role.trim()) {
        setFormError('Please fill out Company Name and Role for all work experiences.');
        return;
      }
    }

    // Validate files for creation
    if (!profile) {
      if (!resumeFile) {
        setFormError('Please upload your resume in PDF format.');
        return;
      }
      if (!photoFile) {
        setFormError('Please upload your profile photo.');
        return;
      }
      if (workSampleFiles.length !== 3) {
        setFormError('You must upload exactly 3 work sample images.');
        return;
      }
    }

    // Create Form Data payload
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('position', position);
    formData.append('experienceType', experienceType);
    formData.append('experienceValue', experienceValue);
    formData.append('skills', skillsStr);
    formData.append('tools', selectedTools.join(','));
    formData.append('gmail', gmail);
    formData.append('languages', languagesStr);
    formData.append('portfolioUrl', portfolioUrl);
    formData.append('schooling', schooling);
    formData.append('workExperience', JSON.stringify(workExperience));

    if (resumeFile) formData.append('resume', resumeFile);
    if (photoFile) formData.append('photo', photoFile);
    if (workSampleFiles.length === 3) {
      workSampleFiles.forEach((file) => {
        formData.append('workSamples', file);
      });
    }

    try {
      setFormLoading(true);
      const res = await fetch('/api/applications/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        setFormSuccess('Profile saved successfully! Redirecting...');
        setEditing(false);
        refreshMe();
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setFormError(json.message || 'Failed to save profile');
      }
    } catch (err) {
      setFormError('Connection error while saving profile.');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="badge badge-success" style={{ fontWeight: 'bold' }}>ACCEPTED (HR Selected)</span>;
      case 'rejected':
        return <span className="badge badge-error">Rejected</span>;
      default:
        return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Pending Review</span>;
    }
  };

  // Rendering logic: If no profile exists and not editing, show the Profile Creation modal/card
  const mustCreateProfile = !profile;

  if (mustCreateProfile || editing) {
    const currentToolsList = position === 'Graphic Designer' ? graphicTools : uiuxTools;

    return (
      <div className="container animate-fade-in" style={{ padding: '20px 0' }}>
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', borderTop: '5px solid var(--accent)' }}>
          <h2 style={{ fontSize: '28px', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User style={{ color: 'var(--accent)' }} />
            {profile ? 'Edit Your Seeker Profile' : 'Complete Seeker Profile (Required)'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
            {profile 
              ? 'Keep your tools and portfolio updated to stand out to Hiring Managers.' 
              : 'Before applying to any job listing, you must set up your designer profile.'
            }
          </p>

          {/* Form Errors */}
          {formError && (
            <div className="card" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '16px', marginBottom: '20px', border: '1px solid var(--error)' }}>
              <AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="card" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '16px', marginBottom: '20px', border: '1px solid var(--success)' }}>
              {formSuccess}
            </div>
          )}

          {/* Profile Completeness Checklist */}
          <div style={{ marginBottom: '25px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>Profile Completeness Checklist</span>
              <span style={{ fontWeight: '800', fontSize: '15px', color: calculateCompleteness() === 100 ? 'var(--success)' : 'var(--primary)' }}>{calculateCompleteness()}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ width: `${calculateCompleteness()}%`, height: '100%', backgroundColor: calculateCompleteness() === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.3s ease' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: fullName.trim() ? 'var(--success)' : 'var(--text-light)' }}>
                <CheckCircle size={14} style={{ color: fullName.trim() ? 'var(--success)' : '#ccc' }} />
                <span>Full Name</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: gmail.trim() ? 'var(--success)' : 'var(--text-light)' }}>
                <CheckCircle size={14} style={{ color: gmail.trim() ? 'var(--success)' : '#ccc' }} />
                <span>Contact Gmail</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: skillsStr.trim() ? 'var(--success)' : 'var(--text-light)' }}>
                <CheckCircle size={14} style={{ color: skillsStr.trim() ? 'var(--success)' : '#ccc' }} />
                <span>Skills Tags</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: selectedTools.length > 0 ? 'var(--success)' : 'var(--text-light)' }}>
                <CheckCircle size={14} style={{ color: selectedTools.length > 0 ? 'var(--success)' : '#ccc' }} />
                <span>Software Tools Selected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: languagesStr.trim() ? 'var(--success)' : 'var(--text-light)' }}>
                <CheckCircle size={14} style={{ color: languagesStr.trim() ? 'var(--success)' : '#ccc' }} />
                <span>Languages Known</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: schooling.trim() ? 'var(--success)' : 'var(--text-light)' }}>
                <CheckCircle size={14} style={{ color: schooling.trim() ? 'var(--success)' : '#ccc' }} />
                <span>Schooling Details</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (profile || resumeFile) ? 'var(--success)' : 'var(--text-light)' }}>
                <CheckCircle size={14} style={{ color: (profile || resumeFile) ? 'var(--success)' : '#ccc' }} />
                <span>Resume PDF Uploaded</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (profile || photoFile) ? 'var(--success)' : 'var(--text-light)' }}>
                <CheckCircle size={14} style={{ color: (profile || photoFile) ? 'var(--success)' : '#ccc' }} />
                <span>Photo & Work Samples</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitProfile} encType="multipart/form-data">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="form-grid-2">
              
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Suryansh"
                />
              </div>

              {/* Seeker Contact Gmail */}
              <div className="form-group">
                <label className="form-label">Gmail Address (For Application Alerts)</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                  placeholder="name@gmail.com"
                />
              </div>

              {/* Position */}
              <div className="form-group">
                <label className="form-label">Target Role Position</label>
                <select className="form-control" value={position} onChange={handlePositionChange}>
                  <option value="Graphic Designer">Graphic Designer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                </select>
              </div>

              {/* Experience */}
              <div className="form-group">
                <label className="form-label">Fresher Experience Level</label>
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
                      setExperienceValue(0); // reset
                    }}
                  >
                    <option value="months">Months (0 - 11)</option>
                    <option value="years">Years (0 - 1)</option>
                  </select>
                </div>
                <small style={{ color: 'var(--text-light)', display: 'block', marginTop: '4px' }}>
                  Only profiles with &lt; 1 year experience are accepted.
                </small>
              </div>

              {/* Skills Tags */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Core Skills (Comma separated tags)</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="e.g. Wireframing, Brand Identity, Mobile Layouts, Prototyping"
                />
              </div>

              {/* Tools Multi-Select */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Software/Tools Known (Select all that apply)</label>
                <div className="checkbox-group">
                  {currentToolsList.map((tool) => (
                    <label key={tool} className="checkbox-label card" style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      border: selectedTools.includes(tool) ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                      backgroundColor: selectedTools.includes(tool) ? 'var(--accent-glow)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
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

              {/* Languages */}
              <div className="form-group">
                <label className="form-label">Languages Known (Comma separated)</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={languagesStr}
                  onChange={(e) => setLanguagesStr(e.target.value)}
                  placeholder="e.g. English, Hindi, Spanish"
                />
              </div>

              {/* Website URL */}
              <div className="form-group">
                <label className="form-label">Portfolio Website URL (Optional)</label>
                <input
                  type="url"
                  className="form-control"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://myportfolio.com"
                />
              </div>

              {/* Schooling Details */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Schooling / Education Details (Required)</label>
                <textarea
                  required
                  rows={2}
                  className="form-control"
                  value={schooling}
                  onChange={(e) => setSchooling(e.target.value)}
                  placeholder="e.g. Bachelor of Design (B.Des) from NID, Class of 2026, CGPA 8.2"
                />
              </div>

              {/* Work Experience dynamic list builder */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Work Experience (Max 3, optional)</label>
                  {workExperience.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Plus size={14} /> Add Experience
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {workExperience.length === 0 ? (
                    <div style={{ padding: '16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>
                      No work experience added yet. Click "Add Experience" to add one.
                    </div>
                  ) : (
                    workExperience.map((exp, index) => (
                      <div key={index} className="card" style={{ padding: '16px', backgroundColor: '#fafbfc', border: '1px solid var(--border-color)', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(index)}
                          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}
                          title="Remove Experience"
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-main)', fontWeight: 'bold' }}>Experience #{index + 1}</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="form-grid-2">
                          {/* Company */}
                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>Company Name *</label>
                            <input
                              type="text"
                              required
                              className="form-control"
                              style={{ padding: '8px 12px', fontSize: '13px' }}
                              value={exp.company}
                              onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                              placeholder="e.g. Suryansh Tech Studio"
                            />
                          </div>
                          
                          {/* Role */}
                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>Role / Designation *</label>
                            <input
                              type="text"
                              required
                              className="form-control"
                              style={{ padding: '8px 12px', fontSize: '13px' }}
                              value={exp.role}
                              onChange={(e) => handleExperienceChange(index, 'role', e.target.value)}
                              placeholder="e.g. Junior Designer"
                            />
                          </div>
                          
                          {/* From Month & Year */}
                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>From Date *</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <select
                                className="form-control"
                                style={{ padding: '8px 12px', fontSize: '13px', flex: 1 }}
                                value={exp.fromMonth}
                                onChange={(e) => handleExperienceChange(index, 'fromMonth', e.target.value)}
                              >
                                {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <select
                                className="form-control"
                                style={{ padding: '8px 12px', fontSize: '13px', flex: 1 }}
                                value={exp.fromYear}
                                onChange={(e) => handleExperienceChange(index, 'fromYear', e.target.value)}
                              >
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                          </div>
                          
                          {/* To Month & Year */}
                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>To Date *</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <select
                                className="form-control"
                                style={{ padding: '8px 12px', fontSize: '13px', flex: 1 }}
                                value={exp.toMonth}
                                onChange={(e) => handleExperienceChange(index, 'toMonth', e.target.value)}
                              >
                                {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <select
                                className="form-control"
                                style={{ padding: '8px 12px', fontSize: '13px', flex: 1 }}
                                value={exp.toYear}
                                onChange={(e) => handleExperienceChange(index, 'toYear', e.target.value)}
                              >
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                          </div>
                          
                          {/* Description */}
                          <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>Description / Responsibilities</label>
                            <textarea
                              rows={2}
                              className="form-control"
                              style={{ padding: '8px 12px', fontSize: '13px' }}
                              value={exp.description}
                              onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                              placeholder="Outline your work, tools used, and contributions..."
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Resume File */}
              <div className="form-group">
                <label className="form-label">Upload Resume (PDF only {profile && '(Leave blank to keep current)'})</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required={!profile}
                  className="form-control"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
              </div>

              {/* Profile Photo */}
              <div className="form-group">
                <label className="form-label">Profile Photo (Image {profile && '(Leave blank to keep current)'})</label>
                <input
                  type="file"
                  accept="image/*"
                  required={!profile}
                  className="form-control"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                />
              </div>

              {/* Work Samples (3 images required) */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Upload Best 3 Work Samples (Must select exactly 3 images {profile && '(Leave blank to keep current)'})</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  required={!profile}
                  className="form-control"
                  onChange={handleWorkSamplesChange}
                />
                <small style={{ color: 'var(--text-light)', display: 'block', marginTop: '4px' }}>
                  Please select 3 images simultaneously. Max size 3MB per image.
                </small>
              </div>

            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '30px' }}>
              {profile && (
                <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">
                  Cancel Edit
                </button>
              )}
              <button type="submit" disabled={formLoading} className="btn btn-primary" style={{ padding: '10px 30px' }}>
                {formLoading ? 'Saving Profile...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .form-grid-2 {
              grid-template-columns: 1fr !important;
            }
            .form-grid-2 > div {
              grid-column: span 1 !important;
            }
          }
        `}} />
      </div>
    );
  }

  // Once profile is created, display Seeker's Dashboard Panel
  return (
    <div className="container animate-fade-in" style={{ padding: '20px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }} className="seeker-dashboard-grid">
        
        {/* Left Column: Seeker Profile details preview */}
        <div>
          <div className="card" style={{ padding: '30px', textAlign: 'center', borderTop: '4px solid var(--primary)', position: 'sticky', top: '90px' }}>
            
            {/* Candidate Photo */}
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px auto', border: '3px solid var(--primary)' }}>
              <img src={profile.photoUrl} alt={profile.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <h2 style={{ fontSize: '22px', color: 'var(--text-main)', marginBottom: '4px' }}>{profile.fullName}</h2>
            <span className="badge badge-primary" style={{ marginBottom: '20px' }}>{profile.position}</span>

            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Experience</strong>
                <span style={{ fontWeight: '600' }}>{profile.experienceValue} {profile.experienceType} (Fresher)</span>
              </div>
              
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Gmail Address</strong>
                <span>{profile.gmail}</span>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Languages Known</strong>
                <span>{profile.languages.join(', ')}</span>
              </div>

              {profile.portfolioUrl && (
                <div>
                  <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Personal Website</strong>
                  <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                    <Globe size={14} /> View Portfolio
                  </a>
                </div>
              )}

              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Schooling / Education Details</strong>
                <span>{profile.schooling}</span>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Resume PDF</strong>
                <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: 'var(--accent)' }}>
                  <FileText size={14} /> Open Resume PDF
                </a>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Software & Tools Known</strong>
                <div className="tag-list">
                  {profile.tools.map((t, idx) => (
                    <span key={idx} className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 'bold' }}>{t}</span>
                  ))}
                </div>
              </div>

              {profile.workExperience && profile.workExperience.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Work Experience</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {profile.workExperience.map((exp, idx) => (
                      <div key={idx} style={{ fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px', backgroundColor: '#fafbfc' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{exp.role}</div>
                        <div style={{ color: 'var(--accent)', fontWeight: '600' }}>{exp.company}</div>
                        <div style={{ color: 'var(--text-light)', fontSize: '10px', marginBottom: '4px' }}>{exp.fromMonth}/{exp.fromYear} – {exp.toMonth}/{exp.toYear}</div>
                        {exp.description && <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>{exp.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setEditing(true)} className="btn btn-outline" style={{ width: '100%', marginTop: '24px' }}>
              Edit Profile details
            </button>
          </div>
        </div>

        {/* Right Column: Applications Tracker & Action block */}
        <div>
          
          {/* Work samples Gallery Grid */}
          <div className="card" style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image size={18} style={{ color: 'var(--accent)' }} />
              Your 3 Portfolio Work Samples (Click to Zoom)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {profile.workSamples.map((img, idx) => (
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
                  <img src={img} alt={`Work Sample ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

          {/* Applications list */}
          <div className="card">
            <h3 style={{ fontSize: '20px', color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} style={{ color: 'var(--primary)' }} />
              Track Applications ({applications.length})
            </h3>

            {loadingApps ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>Loading application history...</div>
            ) : applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-light)' }}>
                <p>You haven't applied to any jobs yet.</p>
                <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '14px', fontSize: '13px' }}>
                  Browse Job Listings
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applications.map((app) => (
                  <div key={app._id} className="card" style={{
                    padding: '20px',
                    backgroundColor: '#fafbfc',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {app.job ? app.job.title : 'Deleted Posting'}
                      </h4>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-light)' }}>
                        <span>Role: {app.job ? app.job.role : 'N/A'}</span>
                        <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

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

      <style dangerouslySetInnerHTML={{__html: `
        .portfolio-thumb:hover .zoom-overlay {
          opacity: 1 !important;
        }
        @media (max-width: 800px) {
          .seeker-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
          .seeker-dashboard-grid > div {
            position: static !important;
          }
        }
      `}} />
    </div>
  );
};

export default SeekerDashboard;
