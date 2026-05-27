import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  FileText, 
  CheckCircle, 
  Image, 
  Globe, 
  Plus, 
  Trash2, 
  Clock, 
  BookOpen, 
  AlertTriangle, 
  Upload, 
  Eye, 
  ChevronRight, 
  LogOut,
  Mail,
  Calendar,
  Phone,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const SeekerDashboard = ({ user, profile, refreshMe, logout }) => {
  const navigate = useNavigate();
  
  // States for applied jobs tracking
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  
  // Profile Editor states
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('Graphic Designer');
  const [skillsStr, setSkillsStr] = useState('');
  const [selectedTools, setSelectedTools] = useState([]);
  const [gmail, setGmail] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [school, setSchool] = useState('');
  const [degree, setDegree] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('Remote');
  const [schooling, setSchooling] = useState('');
  const [workExperience, setWorkExperience] = useState([]);
  const [aboutThem, setAboutThem] = useState('');
  const [relocate, setRelocate] = useState(false);
  const [languagesList, setLanguagesList] = useState([{ language: 'English', fluency: 'Fluent' }]);
  
  // Added fields
  const [mobileNumber, setMobileNumber] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [experienceMonths, setExperienceMonths] = useState(0);

  // Up to 4 best projects
  const [projects, setProjects] = useState([
    { title: '', description: '', link: '', fileUrl: '', videoLink: '' },
    { title: '', description: '', link: '', fileUrl: '', videoLink: '' },
    { title: '', description: '', link: '', fileUrl: '', videoLink: '' },
    { title: '', description: '', link: '', fileUrl: '', videoLink: '' }
  ]);
  const [projectFiles, setProjectFiles] = useState([null, null, null, null]);

  // Track Applications popup modal state
  const [showAppsModal, setShowAppsModal] = useState(false);
  
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
    if (mobileNumber.trim()) score += 10;
    if (skillsStr.trim()) score += 10;
    if (selectedTools.length > 0) score += 10;
    if (languagesList.length > 0 && languagesList[0].language.trim()) score += 10;
    if (school.trim() || schooling.trim()) score += 5;
    if (degree.trim()) score += 5;
    if (location.trim()) score += 10;
    if (aboutThem.trim()) score += 10;
    if (projects.filter(p => p.title.trim()).length > 0) score += 10;
    if (profile || resumeFile) score += 5;
    if (profile || photoFile) score += 5;
    return Math.min(score, 100);
  };

  const languagesStr = languagesList.map(l => l.language).filter(Boolean).join(', ');

  // Define tools lists
  const graphicTools = ['Photoshop', 'Illustrator', 'CorelDRAW', 'Canva', 'Figma'];
  const uiuxTools = ['Figma', 'Adobe XD', 'Framer', 'Midjourney', 'ChatGPT', 'Runway', 'Adobe Firefly'];
  const motionTools = ['After Effects', 'Premiere Pro', 'Cinema 4D', 'Blender', 'Maya', 'Figma'];
  const monthOptions = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const yearOptions = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027'];

  // Initialize fields with profile data if profile exists
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPosition(profile.position || 'Graphic Designer');
      setExperienceYears(profile.experienceYears || 0);
      setExperienceMonths(profile.experienceMonths || 0);
      setSkillsStr(profile.skills ? profile.skills.join(', ') : '');
      setSelectedTools(profile.tools || []);
      setGmail(profile.gmail || '');
      setPortfolioUrl(profile.portfolioUrl || '');
      setSchooling(profile.schooling || '');
      setSchool(profile.school || profile.schooling || '');
      setDegree(profile.degree || '');
      setLocation(profile.location || '');
      setWorkMode(profile.workMode || 'Remote');
      setWorkExperience(profile.workExperience || []);
      setAboutThem(profile.about_them || profile.aboutThem || '');
      setRelocate(profile.relocate || false);
      setMobileNumber(profile.mobileNumber || '');
      setJoiningDate(profile.joiningDate || '');
      
      if (Array.isArray(profile.languages) && profile.languages.length > 0) {
        setLanguagesList(profile.languages);
      } else {
        setLanguagesList([{ language: 'English', fluency: 'Fluent' }]);
      }
      
      if (Array.isArray(profile.portfolioProjects) && profile.portfolioProjects.length > 0) {
        const mapped = [...profile.portfolioProjects];
        while (mapped.length < 4) {
          mapped.push({ title: '', description: '', link: '', fileUrl: '', videoLink: '' });
        }
        setProjects(mapped.slice(0, 4));
      } else {
        setProjects([
          { title: '', description: '', link: '', fileUrl: '', videoLink: '' },
          { title: '', description: '', link: '', fileUrl: '', videoLink: '' },
          { title: '', description: '', link: '', fileUrl: '', videoLink: '' },
          { title: '', description: '', link: '', fileUrl: '', videoLink: '' }
        ]);
      }
    } else {
      // Default info to user's registered details
      if (user) {
        setGmail(user.email || '');
        setMobileNumber(user.mobile || '');
        setFullName(user.name || '');
      }
      setSchooling('');
      setSchool('');
      setDegree('');
      setLocation('');
      setWorkMode('Remote');
      setWorkExperience([]);
      setAboutThem('');
      setRelocate(false);
      setLanguagesList([{ language: 'English', fluency: 'Fluent' }]);
      setProjects([
        { title: '', description: '', link: '', fileUrl: '', videoLink: '' },
        { title: '', description: '', link: '', fileUrl: '', videoLink: '' },
        { title: '', description: '', link: '', fileUrl: '', videoLink: '' },
        { title: '', description: '', link: '', fileUrl: '', videoLink: '' }
      ]);
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

  const handlePositionChange = (e) => {
    const pos = e.target.value;
    setPosition(pos);
    setSelectedTools([]); 
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

  const handleProjectChange = (idx, field, val) => {
    const updated = [...projects];
    updated[idx][field] = val;
    setProjects(updated);
  };

  const handleProjectFileChange = (idx, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setFormError(`Project #${idx + 1} file must be under 20MB.`);
        return;
      }
      const updatedFiles = [...projectFiles];
      updatedFiles[idx] = file;
      setProjectFiles(updatedFiles);
    }
  };

  const handleAddLanguage = () => {
    setLanguagesList([...languagesList, { language: '', fluency: 'Beginner' }]);
  };

  const handleRemoveLanguage = (idx) => {
    setLanguagesList(languagesList.filter((_, i) => i !== idx));
  };

  const handleLanguageChange = (idx, field, val) => {
    const updated = [...languagesList];
    updated[idx][field] = val;
    setLanguagesList(updated);
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validate experience bounds
    const yrs = Number(experienceYears);
    const mths = Number(experienceMonths);
    if (yrs < 0 || yrs > 1) {
      setFormError('Experience in years must be 0 or 1.');
      return;
    }
    if (mths < 0 || mths > 11) {
      setFormError('Experience in months must be between 0 and 11.');
      return;
    }
    if (yrs === 1 && mths > 0) {
      setFormError('Hiring is limited to freshers with less than 1 year total experience.');
      return;
    }

    if (selectedTools.length === 0) {
      setFormError('Please select at least one software/tool.');
      return;
    }

    if (!aboutThem.trim()) {
      setFormError('Please add a bio in "About Them".');
      return;
    }

    if (!school.trim()) {
      setFormError('Please add your school/university name.');
      return;
    }

    if (!degree.trim()) {
      setFormError('Please add your degree or field of study.');
      return;
    }

    if (!location.trim()) {
      setFormError('Please specify your current location.');
      return;
    }

    for (let exp of workExperience) {
      if (!exp.company.trim() || !exp.role.trim()) {
        setFormError('Please fill out Company Name and Role for all work experiences.');
        return;
      }
    }

    // Validate at least 1 project is completed
    const activeProjects = projects.filter(p => p.title.trim() !== '');
    if (activeProjects.length === 0) {
      setFormError('Please add at least one best project details.');
      return;
    }

    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      if (p.title.trim()) {
        if (!p.description.trim() && !p.link.trim()) {
          setFormError(`Please complete details (description and link) for Project #${i + 1}.`);
          return;
        }
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

    // Client-side file size and type validations
    if (photoFile) {
      if (photoFile.size > 2 * 1024 * 1024) {
        setFormError('Profile photo must be less than 2MB in size!');
        return;
      }
      if (!/\.(jpg|jpeg)$/i.test(photoFile.name)) {
        setFormError('Profile photo must be a JPG or JPEG file only!');
        return;
      }
    }

    if (resumeFile) {
      if (resumeFile.size > 2 * 1024 * 1024) {
        setFormError('Resume PDF must be less than 2MB in size!');
        return;
      }
      if (!/\.pdf$/i.test(resumeFile.name)) {
        setFormError('Resume must be a PDF file only!');
        return;
      }
    }

    // Create Form Data payload
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('position', position);
    formData.append('skills', skillsStr);
    formData.append('tools', selectedTools.join(','));
    formData.append('gmail', gmail);
    formData.append('languages', JSON.stringify(languagesList));
    formData.append('portfolioUrl', portfolioUrl);
    formData.append('school', school);
    formData.append('degree', degree);
    formData.append('schooling', `${school} - ${degree}`);
    formData.append('location', location);
    formData.append('workMode', workMode);
    formData.append('workExperience', JSON.stringify(workExperience));
    formData.append('aboutThem', aboutThem);
    formData.append('portfolioProjects', JSON.stringify(projects));
    formData.append('relocate', relocate);
    formData.append('mobileNumber', mobileNumber);
    formData.append('joiningDate', joiningDate);
    formData.append('experienceYears', experienceYears);
    formData.append('experienceMonths', experienceMonths);
    formData.append('experienceType', 'months'); // legacy compatibility
    formData.append('experienceValue', Number(experienceYears) * 12 + Number(experienceMonths)); // legacy compatibility

    if (resumeFile) formData.append('resume', resumeFile);
    if (photoFile) formData.append('photo', photoFile);
    if (workSampleFiles.length === 3) {
      workSampleFiles.forEach((file) => {
        formData.append('workSamples', file);
      });
    }

    // Optional project files uploads
    if (projectFiles[0]) formData.append('projectFile0', projectFiles[0]);
    if (projectFiles[1]) formData.append('projectFile1', projectFiles[1]);
    if (projectFiles[2]) formData.append('projectFile2', projectFiles[2]);
    if (projectFiles[3]) formData.append('projectFile3', projectFiles[3]);

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
      case 'cracked':
      case 'accepted':
        return <span style={{ fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', backgroundColor: '#d1fae5', color: '#065f46' }}>🎉 CRACKED (Hired)</span>;
      case 'rejected':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', backgroundColor: '#fee2e2', color: '#991b1b' }}>Rejected</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', backgroundColor: '#fef3c7', color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> Pending Review</span>;
    }
  };

  const mustCreateProfile = !profile;

  // Marquee Scroller Logo List
  const marqueeLogos = [
    { name: 'Procure', src: 'https://cdn.svgl.app/media/logos/procure.svg', grad: 'from-blue-500 to-indigo-600' },
    { name: 'Shopify', src: 'https://cdn.svgl.app/media/logos/shopify.svg', grad: 'from-yellow-400 to-amber-500' },
    { name: 'Blender', src: 'https://cdn.svgl.app/media/logos/blender.svg', grad: 'from-sky-400 to-blue-600' },
    { name: 'Figma', src: 'https://cdn.svgl.app/media/logos/figma.svg', grad: 'from-purple-500 to-pink-500' },
    { name: 'Spotify', src: 'https://cdn.svgl.app/media/logos/spotify.svg', grad: 'from-pink-500 to-rose-600' },
    { name: 'Lottielab', src: 'https://cdn.svgl.app/media/logos/lottielab.svg', grad: 'from-emerald-400 to-yellow-400' },
    { name: 'Google Cloud', src: 'https://cdn.svgl.app/media/logos/google-cloud.svg', grad: 'from-cyan-400 to-sky-500' },
    { name: 'Bing', src: 'https://cdn.svgl.app/media/logos/bing.svg', grad: 'from-teal-400 to-cyan-500' }
  ];

  return (
    <div className="w-full min-h-screen py-10 px-4 md:px-8 font-sans">
      
      {/* 2. Main Hero Container & Video Background */}
      <div className="relative w-full max-w-[1400px] mx-auto rounded-[48px] bg-white border border-slate-200/50 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] overflow-hidden h-[600px] flex flex-col">
        
        {/* Underlying video background layer */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260505_101331_74f9b798-3f00-4e86-8a01-377aa16ffeaa.mp4"
            className="w-full h-full object-cover scale-105 transition-transform duration-1000"
          />
        </div>

        {/* 3. Hero Text Content Wrapper */}
        <div className="relative z-20 flex-1 px-8 md:px-16 pt-12 md:pt-16 flex flex-col items-start justify-start">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-[650px] text-left"
          >
            <h1 className="font-display text-[42px] md:text-[56px] font-medium tracking-tight text-[#0a1b33] leading-none mb-4">
              Foundation of the<br />new digital epoch
            </h1>
            <p className="font-sans text-[14px] md:text-[15px] text-[#64748b] leading-relaxed mb-6 max-w-[500px]">
              Designing products, powering ecosystems and laying the foundation of a decentralized web for enterprises, builders and communities alike.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const element = document.getElementById("profile-main-section");
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-[#0a152d] text-white font-semibold text-[13px] px-8 py-3.5 rounded-full shadow-md cursor-pointer hover:bg-[#111f3d] transition-colors"
            >
              Contact Us
            </motion.button>
          </motion.div>
        </div>

        {/* 4. Floating Bottom Navbar */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-[420px] px-4">
          <motion.nav
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex items-center justify-between bg-white/90 backdrop-blur-2xl px-1.5 py-1.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-200/40"
          >
            <div className="w-9 h-9 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center text-[#0a1b33] font-bold">
              ✦
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/')}
                className="text-[12px] font-semibold text-slate-500 hover:text-[#0a1b33] cursor-pointer"
              >
                Products
              </button>
              <button 
                onClick={() => setShowAppsModal(true)}
                className="text-[12px] font-semibold text-slate-500 hover:text-[#0a1b33] cursor-pointer"
              >
                Docs
              </button>
            </div>

            <button
              onClick={() => {
                const element = document.getElementById("profile-main-section");
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white px-5 py-2 rounded-full text-[12px] font-semibold text-[#0a1b33] border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
            >
              Get in touch <ChevronRight size={14} className="text-[#0a1b33]" />
            </button>
          </motion.nav>
        </div>
      </div>

      {/* 5. Seamless Marquee Logo Scroller Component */}
      <div className="relative w-full max-w-[1400px] mx-auto mt-10 overflow-hidden marquee-mask">
        <div className="animate-marquee flex gap-6 py-2">
          {/* Double list loop */}
          {[...marqueeLogos, ...marqueeLogos].map((logo, index) => (
            <div
              key={index}
              className="group relative h-24 w-40 shrink-0 flex items-center justify-center rounded-full bg-white border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all overflow-hidden cursor-pointer"
            >
              {/* Dynamic Gradient Overlay */}
              <div className={clsx(
                "absolute inset-0 bg-gradient-to-tr opacity-0 scale-150 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 z-0",
                logo.grad
              )} />
              
              {/* Image */}
              <img
                src={logo.src}
                alt={logo.name}
                className="h-7 w-auto object-contain z-10 transition-all duration-300 group-hover:brightness-0 group-hover:invert"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Profile Form / Preview Container Section */}
      <div id="profile-main-section" className="w-full max-w-[1200px] mx-auto mt-16 scroll-mt-6">
        
        {/* If profile is missing or user is editing, render Editor Form */}
        { (mustCreateProfile || editing) ? (
          <div className="bg-white border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[32px] p-6 md:p-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-[28px] font-display font-semibold text-[#0a1b33] flex items-center gap-2">
                  <User className="text-[#0a66c2]" />
                  {profile ? 'Edit Designer Profile' : 'Setup Designer Profile (Required)'}
                </h2>
                <p className="text-[14px] text-slate-500 mt-1">
                  Complete all details below to activate your candidate profile and apply to recruiter listings.
                </p>
              </div>
              <button 
                onClick={logout}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#ef4444] border border-red-200 hover:bg-red-50 px-4 py-2 rounded-full cursor-pointer transition-all"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-2 text-[14px]">
                <AlertTriangle size={18} className="shrink-0" />
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl p-4 mb-6 text-[14px]">
                {formSuccess}
              </div>
            )}

            {/* Checklist */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-[14px] text-[#0a1b33]">Profile Completeness Progress</span>
                <span className="font-bold text-[14px] text-[#0a66c2]">{calculateCompleteness()}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-[#0a66c2] transition-all duration-300"
                  style={{ width: `${calculateCompleteness()}%` }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className={clsx(fullName.trim() ? "text-emerald-500" : "text-slate-300")} />
                  Full Name
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className={clsx(gmail.trim() ? "text-emerald-500" : "text-slate-300")} />
                  Contact Gmail
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className={clsx(mobileNumber.trim() ? "text-emerald-500" : "text-slate-300")} />
                  Mobile Number
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className={clsx(joiningDate.trim() ? "text-emerald-500" : "text-slate-300")} />
                  Joining Date
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className={clsx(skillsStr.trim() ? "text-emerald-500" : "text-slate-300")} />
                  Skills Tags
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className={clsx(selectedTools.length > 0 ? "text-emerald-500" : "text-slate-300")} />
                  Software Tools
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className={clsx(schooling.trim() ? "text-emerald-500" : "text-slate-300")} />
                  Schooling / Ed
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className={clsx((profile || resumeFile) ? "text-emerald-500" : "text-slate-300")} />
                  Resume PDF
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Suryansh Thakur"
                  />
                </div>

                {/* Gmail */}
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Gmail Address (For alerts)</label>
                  <input
                    type="email"
                    required
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    placeholder="name@gmail.com"
                  />
                </div>

                {/* Mobile Number */}
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. +91 9999988888"
                  />
                </div>

                {/* Target Role Position */}
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Target Role Position</label>
                  <select 
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors bg-white"
                    value={position} 
                    onChange={handlePositionChange}
                  >
                    <option value="Graphic Designer">Graphic Designer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Motion Graphic Designer">Motion Graphic Designer</option>
                  </select>
                </div>

                {/* Experience in Both Years and Months */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Total Experience (Fresher Limits)</label>
                  <div className="flex gap-4">
                    <div className="flex-1 flex flex-col">
                      <select
                        className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors bg-white"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(Number(e.target.value))}
                      >
                        <option value={0}>0 Years</option>
                        <option value={1}>1 Year</option>
                      </select>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <select
                        className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors bg-white"
                        value={experienceMonths}
                        onChange={(e) => setExperienceMonths(Number(e.target.value))}
                      >
                        {Array.from({ length: 12 }).map((_, m) => (
                          <option key={m} value={m}>{m} Months</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <small className="text-[11px] text-slate-400 mt-1">
                    * Note: This platform only registers designers with less than 1 year (0 years and months, or 1 year exactly with 0 months) experience.
                  </small>
                </div>

                {/* Joining Date */}
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Available to Join Date</label>
                  <input
                    type="date"
                    required
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors bg-white"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                  />
                </div>

                {/* Personal Website */}
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Personal Website / Portfolio Link (Optional)</label>
                  <input
                    type="url"
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://myportfolio.com"
                  />
                </div>

                {/* Skills tags */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Core Skills (Comma separated)</label>
                  <input
                    type="text"
                    required
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors"
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    placeholder="e.g. Wireframing, 3D Animation, Figma Prototyping, Brand Design"
                  />
                </div>

                {/* Tools Selection checkboxes */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-[13px] font-semibold text-slate-700 mb-2">Software Tools Used (Select all that apply)</label>
                  <div className="flex flex-wrap gap-2.5">
                    {(position === 'Graphic Designer' ? graphicTools : position === 'Motion Graphic Designer' ? motionTools : uiuxTools).map(tool => (
                      <button
                        type="button"
                        key={tool}
                        onClick={() => handleToolToggle(tool)}
                        className={clsx(
                          "px-4 py-2 rounded-xl text-[13px] font-medium border transition-all cursor-pointer",
                          selectedTools.includes(tool)
                            ? "bg-blue-50 border-[#0a66c2] text-[#0a66c2] shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>

                {/* About Me Bio */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">About Me / Bio</label>
                  <textarea
                    required
                    rows={3}
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors"
                    value={aboutThem}
                    onChange={(e) => setAboutThem(e.target.value)}
                    placeholder="Write a short description about yourself, your design path, and key achievements..."
                  />
                </div>

                {/* Education: School & Degree */}
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">School / College / University Name *</label>
                  <input
                    type="text"
                    required
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. National Institute of Design"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Degree / Field of Study *</label>
                  <input
                    type="text"
                    required
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="e.g. B.Des in UI/UX Design"
                  />
                </div>

                {/* Location & Work Mode */}
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Current Location (City, Country) *</label>
                  <input
                    type="text"
                    required
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Mumbai, India"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5">Preferred Work Mode *</label>
                  <select
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0a66c2] transition-colors bg-white"
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                {/* Relocation checkbox */}
                <div className="flex items-center md:col-span-2 py-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-[#0a66c2]"
                      checked={relocate}
                      onChange={(e) => setRelocate(e.target.checked)}
                    />
                    <span className="text-[13px] font-medium text-slate-600">I am open to relocate for on-site/hybrid positions</span>
                  </label>
                </div>

                {/* Languages Known list builder */}
                <div className="flex flex-col md:col-span-2 border-t border-slate-100 pt-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[14px] font-semibold text-slate-700">Languages Known</label>
                    <button
                      type="button"
                      onClick={handleAddLanguage}
                      className="text-[12px] font-semibold text-[#0a66c2] border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                    >
                      + Add Language
                    </button>
                  </div>
                  <div className="space-y-3">
                    {languagesList.map((lang, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <input
                          type="text"
                          required
                          placeholder="e.g. English, Hindi"
                          className="flex-[2] border border-slate-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-[#0a66c2]"
                          value={lang.language}
                          onChange={(e) => handleLanguageChange(idx, 'language', e.target.value)}
                        />
                        <select
                          className="flex-[1] border border-slate-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-[#0a66c2] bg-white"
                          value={lang.fluency}
                          onChange={(e) => handleLanguageChange(idx, 'fluency', e.target.value)}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Fluent">Fluent</option>
                        </select>
                        {languagesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLanguage(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Up to 4 best Projects with optional file uploads */}
                <div className="flex flex-col md:col-span-2 border-t border-slate-100 pt-6">
                  <h3 className="text-[15px] font-bold text-[#0a1b33] mb-4">
                    Top 4 Best Projects (At least 1 required)
                  </h3>
                  <div className="space-y-4">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5">
                        <h4 className="text-[13px] font-bold text-slate-700 mb-3">Project #{idx + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          <div className="flex flex-col">
                            <label className="text-[11px] font-semibold text-slate-500 mb-1">Project Title {idx === 0 && '*'}</label>
                            <input
                              type="text"
                              required={idx === 0}
                              className="border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#0a66c2] bg-white"
                              value={proj.title}
                              onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                              placeholder="e.g. Branding Design Case Study"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-[11px] font-semibold text-slate-500 mb-1">Website Link {idx === 0 && '*'}</label>
                            <input
                              type="url"
                              required={idx === 0}
                              className="border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#0a66c2] bg-white"
                              value={proj.link}
                              onChange={(e) => handleProjectChange(idx, 'link', e.target.value)}
                              placeholder="https://behance.net/..."
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-[11px] font-semibold text-slate-500 mb-1">Project Video URL Link (Optional)</label>
                            <input
                              type="url"
                              className="border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#0a66c2] bg-white"
                              value={proj.videoLink || ''}
                              onChange={(e) => handleProjectChange(idx, 'videoLink', e.target.value)}
                              placeholder="e.g. YouTube/Vimeo Demo Link"
                            />
                          </div>

                          {/* Optional project file upload */}
                          <div className="flex flex-col">
                            <label className="text-[11px] font-semibold text-slate-500 mb-1">
                              Project Output File / Demo File (Optional)
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                className="border border-slate-200 rounded-xl px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#0a66c2] bg-white flex-1"
                                onChange={(e) => handleProjectFileChange(idx, e)}
                              />
                              {proj.fileUrl && (
                                <a 
                                  href={proj.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-semibold text-[#0a66c2] hover:underline"
                                >
                                  View Current File
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col md:col-span-2">
                            <label className="text-[11px] font-semibold text-slate-500 mb-1">Project Description {idx === 0 && '*'}</label>
                            <textarea
                              required={idx === 0}
                              rows={2}
                              className="border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#0a66c2] bg-white"
                              value={proj.description}
                              onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                              placeholder="Explain your approach, tools and output..."
                            />
                            <small className="text-[10px] text-slate-400 mt-1">
                              Upload PDF, images, or video file up to 20MB.
                            </small>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Section for profile items */}
                <div className="flex flex-col border-t border-slate-100 pt-6">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1">Upload Resume PDF *</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    required={!profile}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-[13px]"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                  />
                  <small className="text-[11px] text-slate-400 mt-1">PDF format only. Max size 2MB.</small>
                </div>

                <div className="flex flex-col border-t border-slate-100 pt-6">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1">Upload Headshot Profile Photo *</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg"
                    required={!profile}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-[13px]"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                  />
                  <small className="text-[11px] text-slate-400 mt-1">JPG/JPEG format only. Max size 2MB.</small>
                </div>

                <div className="flex flex-col md:col-span-2 border-t border-slate-100 pt-6">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1">Upload 3 Portfolio Work Sample Images *</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    required={!profile}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-[13px]"
                    onChange={handleWorkSamplesChange}
                  />
                  <small className="text-[11px] text-slate-400 mt-1">Must select exactly 3 images simultaneously. Max size 3MB per image.</small>
                </div>

              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-end pt-6 border-t border-slate-100">
                {profile && (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="border border-slate-200 hover:bg-slate-50 px-6 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-[#0a66c2] text-white hover:bg-[#004182] px-8 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer transition-colors"
                >
                  {formLoading ? 'Saving Profile...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Profile Details Preview Mode */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Preview Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[32px] p-6 text-center sticky top-24">
                
                {/* Photo Preview */}
                <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-2 border-[#0a66c2]">
                  <img 
                    src={profile.photoUrl} 
                    alt={profile.fullName} 
                    className="w-full h-full object-cover"
                  />
                </div>

                <h2 className="text-[20px] font-display font-semibold text-[#0a1b33]">{profile.fullName}</h2>
                <span className="inline-block bg-blue-50 text-[#0a66c2] text-[11px] font-bold px-3 py-1 rounded-full mt-1">
                  {profile.position}
                </span>

                <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-4 text-[13px] text-slate-700">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Bio Description</span>
                    <p className="line-height-1.4 text-slate-600 white-space-pre-line">{profile.about_them || profile.aboutThem}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Experience</span>
                      <span className="font-semibold text-slate-600">
                        {profile.experienceYears} yrs {profile.experienceMonths} mths
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Mobile Number</span>
                      <span className="font-semibold text-slate-600">{profile.mobileNumber || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Gmail Address</span>
                      <span className="font-semibold text-slate-600">{profile.gmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Available to Join</span>
                      <span className="font-semibold text-slate-600">
                        {profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Immediate'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Languages Known</span>
                    <span className="font-medium text-slate-600">
                      {Array.isArray(profile.languages)
                        ? profile.languages.map(l => `${l.language} (${l.fluency})`).join(', ')
                        : String(profile.languages)}
                    </span>
                  </div>

                  {profile.portfolioUrl && (
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-slate-400" />
                      <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0a66c2] hover:underline">
                        View Portfolio Website
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-slate-400" />
                    <span>Open to relocate: {profile.relocate ? '✅ Yes' : '❌ No'}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Location & Work Mode</span>
                    <p className="text-slate-600 font-semibold">{profile.location || 'Not provided'} ({profile.workMode || 'Remote'})</p>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Education School & Degree</span>
                    <p className="text-slate-600 font-semibold">{profile.school || profile.schooling || 'Not specified'}</p>
                    {profile.degree && <p className="text-[12px] text-slate-500 mt-0.5">{profile.degree}</p>}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <FileText size={16} className="text-red-500" />
                    <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-red-500 hover:underline">
                      Open Resume PDF Document
                    </a>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-2">
                  <button 
                    onClick={() => setEditing(true)} 
                    className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[#0a1b33] font-semibold py-2.5 rounded-full text-[13px] cursor-pointer transition-colors"
                  >
                    Edit Profile Details
                  </button>
                  <button
                    onClick={logout}
                    className="w-full bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-full text-[13px] cursor-pointer transition-colors"
                  >
                    Log Out Session
                  </button>
                </div>

              </div>
            </div>

            {/* Right Preview Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Applications Alert Card */}
              <div className="bg-white border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[32px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-[18px] font-display font-semibold text-[#0a1b33] flex items-center gap-2">
                    <BookOpen size={18} className="text-[#0a66c2]" />
                    Job Application Statuses
                  </h3>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    Track the progress of your submitted design job applications.
                  </p>
                </div>
                <button
                  onClick={() => setShowAppsModal(true)}
                  className="bg-[#0a66c2] text-white hover:bg-[#004182] font-semibold text-[13px] px-6 py-2.5 rounded-full cursor-pointer transition-colors shrink-0"
                >
                  Track {applications.length} Applications
                </button>
              </div>

              {/* Core Skills Tags & Software Tools */}
              <div className="bg-white border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[32px] p-6">
                <h3 className="text-[16px] font-display font-semibold text-[#0a1b33] mb-4 flex items-center gap-2">
                  ✦ Core Software & Design Skills
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Design Methods & Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((s, idx) => (
                        <span key={idx} className="bg-slate-50 text-slate-700 text-[12px] font-medium px-3 py-1.5 rounded-xl border border-slate-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Software Tools</span>
                    <div className="flex flex-wrap gap-2">
                      {profile.tools.map((t, idx) => (
                        <span key={idx} className="bg-blue-50 text-[#0a66c2] text-[12px] font-bold px-3 py-1.5 rounded-xl border border-blue-100">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Best Projects Grid */}
              <div className="bg-white border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[32px] p-6">
                <h3 className="text-[16px] font-display font-semibold text-[#0a1b33] mb-4 flex items-center gap-2">
                  ✦ Top 4 Best Projects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.portfolioProjects && profile.portfolioProjects.filter(p => p.title.trim()).map((proj, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-bold text-[14px] text-slate-700 leading-tight">{proj.title}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">#{idx + 1}</span>
                        </div>
                        <p className="text-[12px] text-slate-600 leading-relaxed mb-4">{proj.description}</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/50">
                        <div className="flex gap-3">
                          {proj.link && (
                            <a 
                              href={proj.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[12px] font-semibold text-[#0a66c2] hover:underline"
                            >
                              Website ↗
                            </a>
                          )}
                          
                          {proj.videoLink && (
                            <a 
                              href={proj.videoLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[12px] font-semibold text-purple-600 hover:underline"
                            >
                              Video Demo ↗
                            </a>
                          )}
                        </div>
                        
                        {proj.fileUrl && (
                          <a
                            href={proj.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 hover:bg-emerald-100 transition-colors"
                          >
                            Download File
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Work Samples Gallery */}
              <div className="bg-white border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[32px] p-6">
                <h3 className="text-[16px] font-display font-semibold text-[#0a1b33] mb-4 flex items-center gap-2">
                  ✦ Selected Portfolio Work Samples
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {profile.workSamples && profile.workSamples.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setLightboxImage(img)}
                      className="group relative aspectRatio-4/3 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm"
                    >
                      <img src={img} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[12px] font-bold gap-1">
                        <Eye size={14} /> Zoom
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Experience Timeline */}
              {profile.workExperience && profile.workExperience.length > 0 && (
                <div className="bg-white border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[32px] p-6">
                  <h3 className="text-[16px] font-display font-semibold text-[#0a1b33] mb-4 flex items-center gap-2">
                    ✦ Internships / Work Experience History
                  </h3>
                  <div className="space-y-4">
                    {profile.workExperience.map((exp, idx) => (
                      <div key={idx} className="border-l-2 border-slate-100 pl-4 py-1 relative">
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-500 -left-[6px] top-2" />
                        <h4 className="font-bold text-[14px] text-slate-800">{exp.role}</h4>
                        <div className="text-[12px] font-semibold text-[#0a66c2]">{exp.company}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 mb-1.5">{exp.fromMonth}/{exp.fromYear} – {exp.toMonth}/{exp.toYear}</div>
                        {exp.description && <p className="text-[12px] text-slate-600 leading-relaxed">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* Track Applications Pop-up Modal */}
      {showAppsModal && (
        <div 
          onClick={() => setShowAppsModal(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200/60 shadow-xl rounded-[32px] p-6 md:p-8 w-full max-w-[600px] max-h-[80vh] overflow-y-auto relative"
          >
            <button
              onClick={() => setShowAppsModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-[18px] cursor-pointer"
            >
              ✕
            </button>
            
            <h2 className="text-[22px] font-display font-semibold text-[#0a1b33] mb-2 flex items-center gap-2">
              <Clock size={20} className="text-[#0a66c2]" />
              Track Applications
            </h2>
            <p className="text-[13px] text-slate-500 mb-6">
              Review and audit feedback on your submitted design applications.
            </p>

            {loadingApps ? (
              <div className="text-center py-10 text-[14px] text-slate-500 font-medium">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-[13px] text-slate-400">
                You have not submitted any job applications yet.
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app._id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-[14px] text-slate-800">{app.job ? app.job.title : 'Position'}</h4>
                      <span className="text-[12px] font-semibold text-[#0a66c2]">{app.job ? app.job.companyName : 'Company'}</span>
                      <div className="flex gap-4 text-[10px] text-slate-400 mt-1">
                        <span>📅 Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                        <span>📍 {app.job ? app.job.location : ''}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Lightbox Overlay */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-[95%] max-h-[95%]" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImage} 
              alt="Zoomed Sample" 
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" 
            />
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white font-semibold text-[12px] px-4 py-2 rounded-full cursor-pointer transition-colors"
            >
              ✕ Close Zoom
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SeekerDashboard;
