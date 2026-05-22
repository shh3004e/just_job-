const express = require('express');
const router = express.Router();
const JobPost = require('../models/JobPost');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/authMiddleware');
const { cleanupJobs } = require('../utils/jobFetcher');

// @desc    Get all open jobs
// @route   GET /api/jobs
// @access  Public (Seekers and anonymous guests can browse)
router.get('/', async (req, res) => {
  try {
    // Run cleanup in real-time before listing
    await cleanupJobs();

    // Return open jobs, sort by newest
    const jobs = await JobPost.find({ status: 'open' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get recruiter's posted jobs
// @route   GET /api/jobs/my-postings
// @access  Private (Recruiter only)
router.get('/my-postings', protect, authorize('recruiter'), async (req, res) => {
  try {
    const jobs = await JobPost.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single job detail
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Post a new job
// @route   POST /api/jobs
// @access  Private (Recruiter only)
router.post('/', protect, authorize('recruiter'), async (req, res) => {
  try {
    const {
      title,
      companyName,
      companyDescription,
      jobType,
      role,
      experienceType,
      experienceValue,
      tools,
      description,
      salary,
      location,
      vacancies,
      hrEmail
    } = req.body;

    // Server-side validation check for minimum salary
    if (Number(salary) < 12000) {
      return res.status(400).json({ success: false, message: 'Salary must be a minimum of ₹12,000/month' });
    }

    // Experience validation bounds check
    const expVal = Number(experienceValue);
    if (experienceType === 'months') {
      if (expVal < 0 || expVal > 11) {
        return res.status(400).json({ success: false, message: 'Experience in months must be between 0 and 11' });
      }
    } else if (experienceType === 'years') {
      if (expVal < 0 || expVal > 1) {
        return res.status(400).json({ success: false, message: 'Experience in years must be 0 or 1' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid experience type' });
    }

    // Role validation check (strictly Graphic Designer, UI/UX Designer, or Motion Graphic Designer)
    const validRoles = ['Graphic Designer', 'UI/UX Designer', 'Motion Graphic Designer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role category. Must be one of: Graphic Designer, UI/UX Designer, or Motion Graphic Designer' });
    }

    // Create job post
    const job = await JobPost.create({
      user: req.user.id,
      title,
      companyName,
      companyDescription,
      jobType,
      role,
      experienceType,
      experienceValue,
      tools,
      description,
      salary,
      location,
      vacancies,
      hrEmail
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Toggle job status (Reopen or Close manually)
// @route   PUT /api/jobs/:id/status
// @access  Private (Recruiter only)
router.put('/:id/status', protect, authorize('recruiter'), async (req, res) => {
  try {
    let job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Check ownership
    if (job.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this job' });
    }

    const { status } = req.body;
    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    job.status = status;
    await job.save();

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete job listing
// @route   DELETE /api/jobs/:id
// @access  Private (Recruiter only)
router.delete('/:id', protect, authorize('recruiter'), async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found' });
    }

    // Check ownership
    if (job.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this job' });
    }

    // Remove job
    await JobPost.findByIdAndDelete(req.params.id);
    
    // Clean up applications for this job
    await Application.deleteMany({ job: req.params.id });

    res.status(200).json({ success: true, message: 'Job listing and associated applications deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
