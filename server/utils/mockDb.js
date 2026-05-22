const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../db.json');

// Initialize database data
let data = {
  users: [],
  jobs: [],
  profiles: [],
  applications: []
};

// Load data from file if exists
const loadFromFile = () => {
  try {
    if (fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      data = JSON.parse(fileData);
    }
  } catch (err) {
    console.error('Error loading mock database file, starting fresh:', err.message);
  }
};

// Save data to file
const saveToFile = () => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving mock database file:', err.message);
  }
};

loadFromFile();

// Query evaluator helper
const evaluateQuery = (item, query) => {
  for (const key in query) {
    const queryVal = query[key];
    
    // Handle special operators like $ne, $in or queries matching referenced object IDs
    if (queryVal && typeof queryVal === 'object' && !Array.isArray(queryVal)) {
      if ('$ne' in queryVal) {
        const itemVal = item[key] ? item[key].toString() : '';
        const neVal = queryVal.$ne ? queryVal.$ne.toString() : '';
        if (itemVal === neVal) return false;
      }
      if ('$in' in queryVal) {
        const itemVal = item[key] ? item[key].toString() : '';
        const inArr = Array.isArray(queryVal.$in) ? queryVal.$in.map(v => v.toString()) : [];
        if (!inArr.includes(itemVal)) return false;
      }
    } else {
      const itemVal = item[key] ? item[key].toString() : '';
      const matchVal = queryVal ? queryVal.toString() : '';
      if (itemVal !== matchVal) return false;
    }
  }
  return true;
};

// Document wrapper to simulate Mongoose document instance methods
const wrapDoc = (collectionName, doc) => {
  if (!doc) return null;
  
  // Clone doc to prevent modifications directly polluting database until .save()
  const wrapped = { ...doc };
  
  wrapped.save = async function() {
    const idx = data[collectionName].findIndex(d => d._id === this._id);
    // Exclude mock methods from saved json
    const cleanDoc = { ...this };
    delete cleanDoc.save;
    delete cleanDoc.populate;
    delete cleanDoc.select;
    
    if (idx !== -1) {
      data[collectionName][idx] = cleanDoc;
    } else {
      data[collectionName].push(cleanDoc);
    }
    saveToFile();
    return this;
  };
  
  wrapped.populate = function(pathStr) {
    if (pathStr === 'profile' && this.profile) {
      const profileId = this.profile.toString();
      const p = data.profiles.find(x => x._id === profileId);
      this.profile = wrapDoc('profiles', p);
    }
    if (pathStr === 'job' && this.job) {
      const jobId = this.job.toString();
      const j = data.jobs.find(x => x._id === jobId);
      this.job = wrapDoc('jobs', j);
    }
    return this;
  };
  
  wrapped.select = function() {
    return this;
  };

  wrapped.matchPassword = async function(enteredPassword) {
    if (collectionName === 'users') {
      return await bcrypt.compare(enteredPassword, this.password);
    }
    return false;
  };
  
  return wrapped;
};

// Single document chain wrapper to support Mongoose query chain builders like .select() and .populate()
const makeSingleChainable = (doc, collectionName) => {
  return {
    _doc: doc,
    select: function() {
      return this;
    },
    populate: function(pathStr) {
      if (this._doc) {
        this._doc = wrapDoc(collectionName, this._doc).populate(pathStr);
      }
      return this;
    },
    then: function(onFulfilled, onRejected) {
      const wrapped = wrapDoc(collectionName, this._doc);
      return Promise.resolve(wrapped).then(onFulfilled, onRejected);
    },
    catch: function(onRejected) {
      const wrapped = wrapDoc(collectionName, this._doc);
      return Promise.resolve(wrapped).catch(onRejected);
    }
  };
};

// Array wrapper to support Mongoose query chain builders like .sort() and .populate()
const makeChainable = (arr, collectionName) => {
  const wrappedList = arr.map(item => wrapDoc(collectionName, item));
  
  wrappedList.sort = function(sortObj) {
    if (sortObj && typeof sortObj === 'object' && !Array.isArray(sortObj)) {
      const key = Object.keys(sortObj)[0];
      const order = sortObj[key];
      Array.prototype.sort.call(wrappedList, (a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (valA < valB) return order === -1 ? 1 : -1;
        if (valA > valB) return order === -1 ? -1 : 1;
        return 0;
      });
      return makeChainable(wrappedList, collectionName);
    }
    Array.prototype.sort.call(wrappedList, sortObj);
    return wrappedList;
  };
  
  wrappedList.populate = function(pathStr) {
    wrappedList.forEach(item => {
      if (pathStr === 'profile' && item.profile) {
        const profileId = item.profile._id ? item.profile._id.toString() : item.profile.toString();
        const p = data.profiles.find(x => x._id === profileId);
        item.profile = wrapDoc('profiles', p);
      }
      if (pathStr === 'job' && item.job) {
        const jobId = item.job._id ? item.job._id.toString() : item.job.toString();
        const j = data.jobs.find(x => x._id === jobId);
        item.job = wrapDoc('jobs', j);
      }
    });
    return makeChainable(wrappedList, collectionName);
  };

  wrappedList.select = function() {
    return this;
  };

  wrappedList.limit = function() {
    return this;
  };

  wrappedList.then = function(onFulfilled, onRejected) {
    return Promise.resolve([...this]).then(onFulfilled, onRejected);
  };

  wrappedList.catch = function(onRejected) {
    return Promise.resolve([...this]).catch(onRejected);
  };
  
  return wrappedList;
};

// Create unique IDs
const generateId = () => {
  return 'mock_' + Math.random().toString(36).substr(2, 9);
};

// User Mock Model
const User = {
  findOne: (query) => {
    const u = data.users.find(item => evaluateQuery(item, query));
    return makeSingleChainable(u, 'users');
  },
  findById: (id) => {
    if (!id) return makeSingleChainable(null, 'users');
    const u = data.users.find(item => item._id === id.toString());
    return makeSingleChainable(u, 'users');
  },
  create: async (userDoc) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userDoc.password, salt);
    
    const newUser = {
      _id: generateId(),
      ...userDoc,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    data.users.push(newUser);
    saveToFile();
    return wrapDoc('users', newUser);
  }
};

// JobPost Mock Model
const JobPost = {
  find: (query = {}) => {
    const filtered = data.jobs.filter(item => evaluateQuery(item, query));
    return makeChainable(filtered, 'jobs');
  },
  findOne: (query) => {
    const j = data.jobs.find(item => evaluateQuery(item, query));
    return makeSingleChainable(j, 'jobs');
  },
  findById: (id) => {
    if (!id) return makeSingleChainable(null, 'jobs');
    const j = data.jobs.find(item => item._id === id.toString());
    return makeSingleChainable(j, 'jobs');
  },
  create: async (jobDoc) => {
    const newJob = {
      _id: generateId(),
      status: 'open',
      createdAt: new Date().toISOString(),
      ...jobDoc
    };
    data.jobs.push(newJob);
    saveToFile();
    return wrapDoc('jobs', newJob);
  },
  findByIdAndDelete: async (id) => {
    const idx = data.jobs.findIndex(item => item._id === id.toString());
    if (idx !== -1) {
      data.jobs.splice(idx, 1);
      saveToFile();
    }
    return true;
  }
};

// JobSeekerProfile Mock Model
const JobSeekerProfile = {
  findOne: (query) => {
    const p = data.profiles.find(item => evaluateQuery(item, query));
    return makeSingleChainable(p, 'profiles');
  },
  findOneAndUpdate: async (query, updateData, options = {}) => {
    let p = data.profiles.find(item => evaluateQuery(item, query));
    if (p) {
      const idx = data.profiles.findIndex(item => item._id === p._id);
      data.profiles[idx] = { ...p, ...updateData };
      saveToFile();
      return wrapDoc('profiles', data.profiles[idx]);
    } else if (options.upsert) {
      const newProfile = {
        _id: generateId(),
        ...query,
        ...updateData
      };
      data.profiles.push(newProfile);
      saveToFile();
      return wrapDoc('profiles', newProfile);
    }
    return null;
  }
};

// Application Mock Model
const Application = {
  find: (query = {}) => {
    const filtered = data.applications.filter(item => evaluateQuery(item, query));
    return makeChainable(filtered, 'applications');
  },
  findOne: (query) => {
    const app = data.applications.find(item => evaluateQuery(item, query));
    return makeSingleChainable(app, 'applications');
  },
  findById: (id) => {
    if (!id) return makeSingleChainable(null, 'applications');
    const app = data.applications.find(item => item._id === id.toString());
    return makeSingleChainable(app, 'applications');
  },
  countDocuments: async (query = {}) => {
    return data.applications.filter(item => evaluateQuery(item, query)).length;
  },
  create: async (appDoc) => {
    const newApp = {
      _id: generateId(),
      status: 'pending',
      appliedAt: new Date().toISOString(),
      ...appDoc
    };
    data.applications.push(newApp);
    saveToFile();
    return wrapDoc('applications', newApp);
  },
  updateMany: async (query, updateData) => {
    data.applications.forEach((item, idx) => {
      if (evaluateQuery(item, query)) {
        data.applications[idx] = { ...item, ...updateData };
      }
    });
    saveToFile();
    return { nModified: data.applications.length };
  },
  deleteMany: async (query) => {
    const countBefore = data.applications.length;
    data.applications = data.applications.filter(item => !evaluateQuery(item, query));
    if (data.applications.length !== countBefore) {
      saveToFile();
    }
    return { deletedCount: countBefore - data.applications.length };
  },
  findByIdAndDelete: async (id) => {
    const idx = data.applications.findIndex(item => item._id === id.toString());
    if (idx !== -1) {
      data.applications.splice(idx, 1);
      saveToFile();
    }
    return true;
  }
};

module.exports = {
  User,
  JobPost,
  JobSeekerProfile,
  Application
};
