const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const JobPost = require('../models/JobPost');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadProfileFiles } = require('../middleware/uploadMiddleware');
const {
  sendApplicationConfirmation,
  sendVacancyFullAlert,
  sendAcceptanceEmail,
  sendRejectionEmail
} = require('../utils/mailer');

// Helper to parse arrays from FormData body
const parseArray = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // Treat as comma separated values
  }
  return String(input).split(',').map(s => s.trim()).filter(Boolean);
};

// @desc    Create or update Job Seeker Profile
// @route   POST /api/applications/profile
// @access  Private (Seekers only)
router.post('/profile', protect, authorize('seeker'), uploadProfileFiles, async (req, res) => {
  try {
    const {
      fullName,
      position,
      experienceType,
      experienceValue,
      skills,
      tools,
      gmail,
      languages,
      portfolioUrl,
      schooling,
      workExperience,
      mobileNumber,
      joiningDate,
      experienceYears,
      experienceMonths
    } = req.body;

    // Check if files exist (if this is a new profile, they are required)
    const files = req.files || {};
    const existingProfile = await JobSeekerProfile.findOne({ user: req.user.id });

    const cleanupUploadedFiles = (uploadedFiles) => {
      if (!uploadedFiles) return;
      Object.keys(uploadedFiles).forEach(key => {
        uploadedFiles[key].forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    };

    // Enforce size limits: photo <= 2MB, resume <= 1MB
    if (files.photo && files.photo[0]) {
      const photoSize = fs.statSync(files.photo[0].path).size;
      if (photoSize > 2 * 1024 * 1024) {
        cleanupUploadedFiles(files);
        return res.status(400).json({ success: false, message: 'Profile photo must be under 2MB in size!' });
      }
    }

    if (files.resume && files.resume[0]) {
      const resumeSize = fs.statSync(files.resume[0].path).size;
      if (resumeSize > 1 * 1024 * 1024) {
        cleanupUploadedFiles(files);
        return res.status(400).json({ success: false, message: 'Resume PDF must be under 1MB in size!' });
      }
    }

    if (!existingProfile) {
      if (!files.resume || !files.photo || !files.workSamples || files.workSamples.length !== 3) {
        cleanupUploadedFiles(files);
        return res.status(400).json({
          success: false,
          message: 'Please upload all required files: Resume (PDF), Profile Photo, and exactly 3 Work Samples.'
        });
      }
    }

    // Process file paths (saving relative paths)
    let resumeUrl = existingProfile ? existingProfile.resumeUrl : '';
    let photoUrl = existingProfile ? existingProfile.photoUrl : '';
    let workSamples = existingProfile ? existingProfile.workSamples : [];

    if (files.resume && files.resume[0]) {
      resumeUrl = `/uploads/${files.resume[0].filename}`;
    }
    if (files.photo && files.photo[0]) {
      photoUrl = `/uploads/${files.photo[0].filename}`;
    }
    if (files.workSamples && files.workSamples.length === 3) {
      workSamples = files.workSamples.map(file => `/uploads/${file.filename}`);
    }

    let parsedWorkExperience = [];
    if (workExperience) {
      try {
        parsedWorkExperience = typeof workExperience === 'string' ? JSON.parse(workExperience) : workExperience;
      } catch (err) {
        console.error('Error parsing workExperience:', err.message);
      }
    }

    let parsedPortfolioProjects = [];
    if (req.body.portfolioProjects) {
      try {
        parsedPortfolioProjects = typeof req.body.portfolioProjects === 'string' ? JSON.parse(req.body.portfolioProjects) : req.body.portfolioProjects;
      } catch (err) {
        console.error('Error parsing portfolioProjects:', err.message);
      }
    }

    // Map uploaded project files
    for (let i = 0; i < 3; i++) {
      if (parsedPortfolioProjects[i]) {
        const fileKey = `projectFile${i}`;
        if (files[fileKey] && files[fileKey][0]) {
          parsedPortfolioProjects[i].fileUrl = `/uploads/${files[fileKey][0].filename}`;
        } else if (existingProfile && existingProfile.portfolioProjects && existingProfile.portfolioProjects[i]) {
          parsedPortfolioProjects[i].fileUrl = existingProfile.portfolioProjects[i].fileUrl || '';
        }
      }
    }

    let parsedLanguages = [];
    if (req.body.languages) {
      try {
        parsedLanguages = typeof req.body.languages === 'string' ? JSON.parse(req.body.languages) : req.body.languages;
      } catch (err) {
        parsedLanguages = parseArray(req.body.languages).map(lang => ({ language: lang, fluency: 'Fluent' }));
      }
    }

    const about_them = req.body.about_them || req.body.aboutThem || '';
    const relocate = req.body.relocate === 'true' || req.body.relocate === true;

    const profileData = {
      user: req.user.id,
      fullName,
      position,
      experienceType: experienceType || 'months',
      experienceValue: Number(experienceValue || 0),
      skills: parseArray(skills),
      tools: parseArray(tools),
      gmail,
      languages: parsedLanguages,
      resumeUrl,
      photoUrl,
      workSamples,
      portfolioUrl: portfolioUrl || '',
      schooling,
      workExperience: parsedWorkExperience,
      about_them,
      portfolioProjects: parsedPortfolioProjects,
      relocate,
      mobileNumber: mobileNumber || '',
      joiningDate: joiningDate || '',
      experienceYears: Number(experienceYears || 0),
      experienceMonths: Number(experienceMonths || 0)
    };

    // Upsert profile
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user.id },
      profileData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    // Delete newly uploaded files if error occurs to avoid orphan uploads
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        req.files[key].forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Apply for a job
// @route   POST /api/applications/apply/:jobId
// @access  Private (Seeker only)
router.post('/apply/:jobId', protect, authorize('seeker'), async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Applications are no longer accepted for this job' });
    }

    // Get seeker profile
    const profile = await JobSeekerProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please create your profile before applying'
      });
    }

    // Check if seeker already applied
    const alreadyApplied = await Application.findOne({
      job: job._id,
      seeker: req.user.id
    });
    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }

    // Check vacancy count before applying
    const currentApplicationsCount = await Application.countDocuments({
      job: job._id,
      status: { $in: ['cracked', 'pending'] }
    });
    if (currentApplicationsCount >= job.vacancies) {
      // Auto pause the listing
      job.status = 'paused';
      await job.save();
      return res.status(400).json({
        success: false,
        message: 'This position has hit its vacancy limit and is no longer accepting applications'
      });
    }

    // Create Application
    const application = await Application.create({
      job: job._id,
      profile: profile._id,
      seeker: req.user.id
    });

    // Send application confirmation to job seeker in background
    sendApplicationConfirmation(profile.gmail, profile.fullName, job.title).catch(err => {
      console.error('Error sending application confirmation:', err.message);
    });

    // Re-check vacancies count after applying
    const newApplicationsCount = currentApplicationsCount + 1;
    if (newApplicationsCount === job.vacancies) {
      // Toggle job status to paused
      job.status = 'paused';
      await job.save();

      // Notify Recruiter/HR repeatedly in background
      sendVacancyFullAlert(job.hrEmail, job.title, job.vacancies).catch(err => {
        console.error('Error sending vacancy full alert:', err.message);
      });
    }

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all applications for a specific job listing
// @route   GET /api/applications/job/:jobId
// @access  Private (Recruiter only)
router.get('/job/:jobId', protect, authorize('recruiter'), async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Check job listing ownership
    if (job.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these applications' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('profile')
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all applications submitted by the logged-in seeker
// @route   GET /api/applications/my-applications
// @access  Private (Seeker only)
router.get('/my-applications', protect, authorize('seeker'), async (req, res) => {
  try {
    const applications = await Application.find({ seeker: req.user.id })
      .populate('job')
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update application status (Accept / Reject)
// @route   POST /api/applications/:id/status
// @access  Private (Recruiter only)
router.post('/:id/status', protect, authorize('recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['cracked', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update. Must be cracked or rejected.' });
    }

    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('profile');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify recruitment ownership of the job
    if (application.job.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();

    const job = application.job;
    const seekerProfile = application.profile;

    if (status === 'cracked') {
      // Send acceptance email in background
      sendAcceptanceEmail(seekerProfile.gmail, seekerProfile.fullName, job.title, job.hrEmail).catch(err => {
        console.error('Error sending acceptance email:', err.message);
      });

      const totalCracked = await Application.countDocuments({ job: job._id, status: 'cracked' });
      if (totalCracked >= job.vacancies) {
        // Auto close the listing
        job.status = 'closed';
        await job.save();

        // Get other pending apps BEFORE updating their status, to email them
        const otherPendingApps = await Application.find({
          job: job._id,
          status: 'pending'
        }).populate('profile');

        if (otherPendingApps.length > 0) {
          // Automatically reject all other pending applications for this job
          await Application.updateMany(
            { job: job._id, status: 'pending' },
            { status: 'rejected' }
          );

          // Send rejection emails in background to other seekers that were pending
          for (const app of otherPendingApps) {
            if (app.profile && app.profile.gmail) {
              sendRejectionEmail(app.profile.gmail, app.profile.fullName, job.title).catch(err => {
                console.error('Error sending rejection email:', err.message);
              });
            }
          }
        }
      } else {
        // If we still have vacancies, check if we need to reopen/unpause the job
        const totalPending = await Application.countDocuments({ job: job._id, status: 'pending' });
        if (totalCracked + totalPending < job.vacancies && (job.status === 'closed' || job.status === 'paused')) {
          job.status = 'open';
          await job.save();
        }
      }

    } else if (status === 'rejected') {
      // Send polite rejection email in background
      sendRejectionEmail(seekerProfile.gmail, seekerProfile.fullName, job.title).catch(err => {
        console.error('Error sending rejection email:', err.message);
      });

      // Reopen job posting if it was closed or paused and we just rejected a candidate freeing up a slot
      const totalCracked = await Application.countDocuments({ job: job._id, status: 'cracked' });
      const totalPending = await Application.countDocuments({ job: job._id, status: 'pending' });
      if (totalCracked < job.vacancies && (totalCracked + totalPending) < job.vacancies && (job.status === 'closed' || job.status === 'paused')) {
        job.status = 'open';
        await job.save();
      }
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Remove unselected candidates individually (Delete application)
// @route   DELETE /api/applications/:id
// @access  Private (Recruiter only)
router.delete('/:id', protect, authorize('recruiter'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify recruiter owns this job
    if (application.job.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this application' });
    }

    await Application.findByIdAndDelete(req.params.id);

    // If deleting this application frees up vacancy slots, reopen the job post if it was closed or paused
    const job = application.job;
    const totalCracked = await Application.countDocuments({ job: job._id, status: 'cracked' });
    const totalPending = await Application.countDocuments({ job: job._id, status: 'pending' });
    if (totalCracked < job.vacancies && (totalCracked + totalPending) < job.vacancies && (job.status === 'closed' || job.status === 'paused')) {
      job.status = 'open';
      await job.save();
    }

    res.status(200).json({ success: true, message: 'Candidate application removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// @desc    Get recently accepted seeker profiles for the home page banner
// @route   GET /api/applications/accepted-seekers
// @access  Public
router.get('/accepted-seekers', async (req, res) => {
  try {
    const applications = await Application.find({ status: 'cracked' })
      .populate('profile')
      .sort({ appliedAt: -1 })
      .limit(20);

    const profiles = [];
    const seenProfileIds = new Set();

    for (const app of applications) {
      if (app.profile && !seenProfileIds.has(app.profile._id.toString())) {
        seenProfileIds.add(app.profile._id.toString());
        profiles.push({
          _id: app.profile._id,
          fullName: app.profile.fullName,
          photoUrl: app.profile.photoUrl,
          position: app.profile.position
        });
      }
      if (profiles.length >= 5) break;
    }

    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Resume paused job posting, adjusting vacancies count
// @route   POST /api/applications/resume-job/:jobId
// @access  Private (Recruiter only)
router.post('/resume-job/:jobId', protect, authorize('recruiter'), async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    if (job.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this job' });
    }

    // Get count of cracked candidates
    const crackedCount = await Application.countDocuments({
      job: job._id,
      status: 'cracked'
    });

    if (crackedCount >= job.vacancies) {
      return res.status(400).json({
        success: false,
        message: 'Cannot resume listing. All vacancy slots have been filled by accepted (cracked) candidates.'
      });
    }

    // Adjust vacancies count by deducting the cracked count
    job.vacancies = job.vacancies - crackedCount;
    job.status = 'open';
    await job.save();

    res.status(200).json({ success: true, message: 'Job listing resumed successfully', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
