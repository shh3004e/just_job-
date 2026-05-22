const mongoose = require('mongoose');

const JobPostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a position/designation title'],
    trim: true
  },
  companyName: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true
  },
  companyDescription: {
    type: String,
    required: [true, 'Please add a company description'],
    trim: true
  },
  jobType: {
    type: String,
    enum: ['Remote', 'On-site', 'Hybrid'],
    required: [true, 'Please select a job type']
  },
  role: {
    type: String,
    enum: ['Graphic Designer', 'UI/UX Designer', 'Motion Graphic Designer'],
    required: [true, 'Please select a job role']
  },
  experienceType: {
    type: String,
    enum: ['months', 'years'],
    required: true
  },
  experienceValue: {
    type: Number,
    required: [true, 'Please specify the experience required'],
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
  tools: {
    type: [String],
    required: [true, 'Please select the required software/tools']
  },
  description: {
    type: String,
    required: [true, 'Please add a role description'],
    trim: true
  },
  salary: {
    type: Number,
    required: [true, 'Please specify monthly salary in INR'],
    min: [12000, 'Salary must be a minimum of ₹12,000/month']
  },
  location: {
    type: String,
    required: [true, 'Please add a location/area'],
    trim: true
  },
  vacancies: {
    type: Number,
    required: [true, 'Please specify the number of vacancies'],
    min: [1, 'Number of vacancies must be at least 1']
  },
  hrEmail: {
    type: String,
    required: [true, 'Please add an HR contact email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid HR email'
    ],
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  isExternal: {
    type: Boolean,
    default: false
  },
  externalId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseJobPost = mongoose.model('JobPost', JobPostSchema);
const mockDb = require('../utils/mockDb');

module.exports = new Proxy(MongooseJobPost, {
  get(target, prop) {
    if (global.useMockDb && mockDb.JobPost[prop] !== undefined) {
      return mockDb.JobPost[prop];
    }
    return target[prop];
  }
});
