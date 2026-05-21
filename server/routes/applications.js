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
      workExperience
    } = req.body;

    // Check if files exist (if this is a new profile, they are required)
    const files = req.files || {};
    const existingProfile = await JobSeekerProfile.findOne({ user: req.user.id });

    if (!existingProfile) {
      if (!files.resume || !files.photo || !files.workSamples || files.workSamples.length !== 3) {
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

    const profileData = {
      user: req.user.id,
      fullName,
      position,
      experienceType,
      experienceValue: Number(experienceValue),
      skills: parseArray(skills),
      tools: parseArray(tools),
      gmail,
      languages: parseArray(languages),
      resumeUrl,
      photoUrl,
      workSamples,
      portfolioUrl: portfolioUrl || '',
      schooling,
      workExperience: parsedWorkExperience
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
      status: { $in: ['accepted', 'pending'] }
    });
    if (currentApplicationsCount >= job.vacancies) {
      // Auto close the listing
      job.status = 'closed';
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

    // Send application confirmation to job seeker
    await sendApplicationConfirmation(profile.gmail, profile.fullName, job.title);

    // Re-check vacancies count after applying
    const newApplicationsCount = currentApplicationsCount + 1;
    if (newApplicationsCount === job.vacancies) {
      // Toggle job status to closed
      job.status = 'closed';
      await job.save();

      // Notify Recruiter/HR repeatedly (triggers in background, see mailer.js)
      await sendVacancyFullAlert(job.hrEmail, job.title, job.vacancies);
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
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update. Must be accepted or rejected.' });
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

    if (status === 'accepted') {
      // Send acceptance email
      await sendAcceptanceEmail(seekerProfile.gmail, seekerProfile.fullName, job.title, job.hrEmail);

      const totalAccepted = await Application.countDocuments({ job: job._id, status: 'accepted' });
      if (totalAccepted >= job.vacancies) {
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

          // Send rejection emails to other seekers that were pending
          for (const app of otherPendingApps) {
            if (app.profile && app.profile.gmail) {
              await sendRejectionEmail(app.profile.gmail, app.profile.fullName, job.title);
            }
          }
        }
      } else {
        // If we still have vacancies, check if we need to reopen the job
        // (if the total number of applications (accepted + pending) is less than vacancies, we can reopen it)
        const totalPending = await Application.countDocuments({ job: job._id, status: 'pending' });
        if (totalAccepted + totalPending < job.vacancies && job.status === 'closed') {
          job.status = 'open';
          await job.save();
        }
      }

    } else if (status === 'rejected') {
      // Send polite rejection email
      await sendRejectionEmail(seekerProfile.gmail, seekerProfile.fullName, job.title);

      // Reopen job posting (make active again) if it was auto-closed due to vacancy limit
      // and we just freed a slot by rejecting a candidate
      const totalAccepted = await Application.countDocuments({ job: job._id, status: 'accepted' });
      const totalPending = await Application.countDocuments({ job: job._id, status: 'pending' });
      if (totalAccepted < job.vacancies && (totalAccepted + totalPending) < job.vacancies && job.status === 'closed') {
        // Automatically set status back to open since we have vacancies available
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

    // If deleting this application frees up vacancy slots, reopen the job post if it was closed
    const job = application.job;
    const totalAccepted = await Application.countDocuments({ job: job._id, status: 'accepted' });
    const totalPending = await Application.countDocuments({ job: job._id, status: 'pending' });
    if (totalAccepted < job.vacancies && (totalAccepted + totalPending) < job.vacancies && job.status === 'closed') {
      job.status = 'open';
      await job.save();
    }

    res.status(200).json({ success: true, message: 'Candidate application removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
