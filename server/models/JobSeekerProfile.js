const mongoose = require('mongoose');

const JobSeekerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: [true, 'Please add your full name'],
    trim: true
  },
  position: {
    type: String,
    enum: ['Graphic Designer', 'UI/UX Designer'],
    required: [true, 'Please select your position']
  },
  experienceType: {
    type: String,
    enum: ['months', 'years'],
    required: true
  },
  experienceValue: {
    type: Number,
    required: [true, 'Please enter your experience'],
    validate: {
      validator: function(val) {
        if (this.experienceType === 'months') {
          return val >= 0 && val <= 11;
        } else {
          return val >= 0 && val <= 1;
        }
      },
      message: 'Experience must be fresher-level (0-11 months OR 0-1 years only).'
    }
  },
  skills: {
    type: [String],
    required: [true, 'Please add at least one skill']
  },
  tools: {
    type: [String],
    required: [true, 'Please select at least one software/tool']
  },
  gmail: {
    type: String,
    required: [true, 'Please add your contact Gmail address'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],
    lowercase: true,
    trim: true
  },
  languages: {
    type: [String],
    required: [true, 'Please add languages known']
  },
  resumeUrl: {
    type: String,
    required: [true, 'Please upload your resume (PDF only)']
  },
  photoUrl: {
    type: String,
    required: [true, 'Please upload your profile photo']
  },
  workSamples: {
    type: [String],
    validate: {
      validator: function(val) {
        return val.length === 3;
      },
      message: 'You must upload exactly 3 work samples.'
    },
    required: [true, 'Please upload exactly 3 work samples']
  },
  portfolioUrl: {
    type: String,
    trim: true
  },
  schooling: {
    type: String,
    required: [true, 'Please add your schooling/education details'],
    trim: true
  },
  workExperience: [
    {
      company: { type: String, required: true },
      role: { type: String, required: true },
      fromMonth: { type: String, required: true },
      fromYear: { type: String, required: true },
      toMonth: { type: String, required: true },
      toYear: { type: String, required: true },
      description: { type: String }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseJobSeekerProfile = mongoose.model('JobSeekerProfile', JobSeekerProfileSchema);
const mockDb = require('../utils/mockDb');

module.exports = new Proxy(MongooseJobSeekerProfile, {
  get(target, prop) {
    if (global.useMockDb && mockDb.JobSeekerProfile[prop] !== undefined) {
      return mockDb.JobSeekerProfile[prop];
    }
    return target[prop];
  }
});
