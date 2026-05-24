const mockDb = require('../utils/mockDb');

const mapAppToMongoose = async (app) => {
  if (!app) return null;
  
  const mapped = {
    _id: app.id,
    id: app.id,
    job: app.job_id,
    profile: app.seeker_id,
    seeker: app.seeker_id,
    status: app.status,
    appliedAt: app.applied_at
  };

  mapped.save = async () => {
    const { pool } = require('../config/db');
    await pool.query('UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [mapped.status, mapped.id]);
    return mapped;
  };

  mapped.populate = async (field) => {
    const { pool } = require('../config/db');
    if (field === 'job') {
      const res = await pool.query('SELECT * FROM job_posts WHERE id = $1', [app.job_id]);
      if (res.rows.length > 0) {
        const JobPost = require('./JobPost');
        mapped.job = JobPost.mapJobToMongoose(res.rows[0]);
      }
    }
    if (field === 'profile') {
      const res = await pool.query('SELECT * FROM job_seeker_profiles WHERE seeker_id = $1', [app.seeker_id]);
      if (res.rows.length > 0) {
        const JobSeekerProfile = require('./JobSeekerProfile');
        mapped.profile = JobSeekerProfile.mapProfileToMongoose(res.rows[0]);
      }
    }
    return mapped;
  };

  return mapped;
};

const find = (conditions) => {
  let populateField = null;
  
  const execute = async () => {
    if (global.useMockDb) {
      return mockDb.Application.find(conditions);
    }
    const { pool } = require('../config/db');
    let queryStr = 'SELECT * FROM applications';
    const queryParams = [];
    const clauses = [];
    
    if (conditions.job) {
      queryParams.push(conditions.job);
      clauses.push(`job_id = $${queryParams.length}`);
    }
    if (conditions.seeker) {
      queryParams.push(conditions.seeker);
      clauses.push(`seeker_id = $${queryParams.length}`);
    }
    if (conditions.status) {
      if (conditions.status.$in) {
        const placeholders = conditions.status.$in.map((val, idx) => {
          queryParams.push(val);
          return `$${queryParams.length}`;
        });
        clauses.push(`status IN (${placeholders.join(', ')})`);
      } else {
        queryParams.push(conditions.status);
        clauses.push(`status = $${queryParams.length}`);
      }
    }
    
    if (clauses.length > 0) {
      queryStr += ' WHERE ' + clauses.join(' AND ');
    }
    
    queryStr += ' ORDER BY applied_at DESC';
    
    const res = await pool.query(queryStr, queryParams);
    const apps = res.rows;
    
    const finalApps = [];
    for (let app of apps) {
      // 4-day auto rejection rule check
      const daysSinceApplied = (Date.now() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60 * 24);
      if (app.status === 'pending' && daysSinceApplied >= 4) {
        app.status = 'rejected';
        await pool.query('UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['rejected', app.id]);
      }
      
      const mapped = await mapAppToMongoose(app);
      if (populateField) {
        await mapped.populate(populateField);
      }
      finalApps.push(mapped);
    }
    return finalApps;
  };

  const chain = {
    populate: function(field) {
      populateField = field;
      return this;
    },
    sort: function() {
      return this;
    },
    then: function(onSuccess, onFailure) {
      return execute().then(onSuccess, onFailure);
    }
  };

  return chain;
};

const findById = (id) => {
  let populateFields = [];
  
  const execute = async () => {
    if (global.useMockDb) {
      return mockDb.Application.findById(id);
    }
    const { pool } = require('../config/db');
    const res = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    
    const app = res.rows[0];
    
    const daysSinceApplied = (Date.now() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60 * 24);
    if (app.status === 'pending' && daysSinceApplied >= 4) {
      app.status = 'rejected';
      await pool.query('UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['rejected', app.id]);
    }
    
    const mapped = await mapAppToMongoose(app);
    for (const field of populateFields) {
      await mapped.populate(field);
    }
    return mapped;
  };

  const chain = {
    populate: function(field) {
      populateFields.push(field);
      return this;
    },
    then: function(onSuccess, onFailure) {
      return execute().then(onSuccess, onFailure);
    }
  };

  return chain;
};

const countDocuments = async (conditions) => {
  if (global.useMockDb) {
    return mockDb.Application.countDocuments(conditions);
  }
  const { pool } = require('../config/db');
  let queryStr = 'SELECT COUNT(*) FROM applications';
  const queryParams = [];
  const clauses = [];
  
  if (conditions.job) {
    queryParams.push(conditions.job);
    clauses.push(`job_id = $${queryParams.length}`);
  }
  if (conditions.status) {
    if (conditions.status.$in) {
      const placeholders = conditions.status.$in.map((val, idx) => {
        queryParams.push(val);
        return `$${queryParams.length}`;
      });
      clauses.push(`status IN (${placeholders.join(', ')})`);
    } else {
      queryParams.push(conditions.status);
      clauses.push(`status = $${queryParams.length}`);
    }
  }
  
  if (clauses.length > 0) {
    queryStr += ' WHERE ' + clauses.join(' AND ');
  }
  
  const res = await pool.query(queryStr, queryParams);
  return parseInt(res.rows[0].count, 10);
};

const deleteMany = async (conditions) => {
  if (global.useMockDb) {
    return mockDb.Application.deleteMany(conditions);
  }
  const { pool } = require('../config/db');
  if (conditions.job) {
    await pool.query('DELETE FROM applications WHERE job_id = $1', [conditions.job]);
  }
  return { deletedCount: 1 };
};

const updateMany = async (conditions, updateFields) => {
  if (global.useMockDb) {
    return mockDb.Application.updateMany(conditions, updateFields);
  }
  const { pool } = require('../config/db');
  if (conditions.job && conditions.status === 'pending' && updateFields.status === 'rejected') {
    await pool.query('UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE job_id = $2 AND status = $3', ['rejected', conditions.job, 'pending']);
  }
  return { modifiedCount: 1 };
};

const findOne = async (conditions) => {
  if (global.useMockDb) {
    return mockDb.Application.findOne(conditions);
  }
  const { pool } = require('../config/db');
  let queryStr = 'SELECT * FROM applications';
  const queryParams = [];
  const clauses = [];
  
  if (conditions.job) {
    queryParams.push(conditions.job);
    clauses.push(`job_id = $${queryParams.length}`);
  }
  if (conditions.seeker) {
    queryParams.push(conditions.seeker);
    clauses.push(`seeker_id = $${queryParams.length}`);
  }
  
  if (clauses.length > 0) {
    queryStr += ' WHERE ' + clauses.join(' AND ');
  }
  
  const res = await pool.query(queryStr, queryParams);
  if (res.rows.length === 0) return null;
  return mapAppToMongoose(res.rows[0]);
};

const create = async (fields) => {
  if (global.useMockDb) {
    return mockDb.Application.create(fields);
  }
  const { pool } = require('../config/db');
  const res = await pool.query(
    `INSERT INTO applications (job_id, seeker_id, status)
     VALUES ($1, $2, $3) RETURNING *`,
    [fields.job, fields.seeker, fields.status || 'pending']
  );
  return mapAppToMongoose(res.rows[0]);
};

module.exports = {
  find,
  findById,
  countDocuments,
  deleteMany,
  updateMany,
  findOne,
  create
};
