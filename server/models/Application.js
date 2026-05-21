const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.ObjectId,
    ref: 'JobPost',
    required: true
  },
  profile: {
    type: mongoose.Schema.ObjectId,
    ref: 'JobSeekerProfile',
    required: true
  },
  seeker: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a seeker can only apply once to a specific job post
ApplicationSchema.index({ job: 1, seeker: 1 }, { unique: true });

const MongooseApplication = mongoose.model('Application', ApplicationSchema);
const mockDb = require('../utils/mockDb');

module.exports = new Proxy(MongooseApplication, {
  get(target, prop) {
    if (global.useMockDb && mockDb.Application[prop] !== undefined) {
      return mockDb.Application[prop];
    }
    return target[prop];
  }
});
