const mockDb = require('../utils/mockDb');

const makeJobChainable = (promise) => {
  promise.sort = function() {
    return this;
  };
  return promise;
};

const mapJobToMongoose = (job) => {
  if (!job) return null;
  
  const parseJsonField = (field) => {
    if (!field) return [];
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return [];
      }
    }
    return field;
  };

  const jobObj = {
    _id: job.id,
    id: job.id,
    user: job.recruiter_id,
    title: job.title,
    companyName: job.company_name,
    companyDescription: job.company_description,
    companyLogoUrl: job.company_logo_url || '',
    jobType: job.job_type,
    offeringType: job.offering_type,
    role: job.role,
    experienceType: job.experience_type,
    experienceValue: job.experience_value,
    tools: job.tools || [],
    description: job.description,
    salary: job.salary,
    location: job.location,
    vacancies: job.vacancies,
    hrEmail: job.hr_email,
    hrName: job.hr_name,
    skills: job.skills || [],
    languages: job.languages || [],
    custom_questions: parseJsonField(job.custom_questions),
    isExternal: job.is_external || false,
    externalId: job.external_id || null,
    status: job.status || 'open',
    createdAt: job.created_at
  };

  jobObj.save = async () => {
    const { pool } = require('../config/db');
    await pool.query(
      `UPDATE job_posts 
       SET title = $1, company_name = $2, company_description = $3, company_logo_url = $4,
           job_type = $5, offering_type = $6, role = $7, experience_type = $8, experience_value = $9,
           tools = $10, description = $11, salary = $12, location = $13, vacancies = $14,
           hr_email = $15, hr_name = $16, skills = $17, languages = $18, custom_questions = $19,
           is_external = $20, external_id = $21, status = $22
       WHERE id = $23`,
      [
        jobObj.title,
        jobObj.companyName,
        jobObj.companyDescription,
        jobObj.companyLogoUrl || null,
        jobObj.jobType,
        jobObj.offeringType,
        jobObj.role,
        jobObj.experienceType,
        Number(jobObj.experienceValue),
        jobObj.tools,
        jobObj.description,
        Number(jobObj.salary),
        jobObj.location,
        Number(jobObj.vacancies),
        jobObj.hrEmail,
        jobObj.hrName,
        jobObj.skills,
        jobObj.languages,
        JSON.stringify(jobObj.custom_questions || []),
        jobObj.isExternal,
        jobObj.externalId,
        jobObj.status,
        jobObj.id
      ]
    );
    return jobObj;
  };

  return jobObj;
};

const find = (conditions = {}) => {
  const execute = async () => {
    if (global.useMockDb) {
      return mockDb.JobPost.find(conditions);
    }
    const { pool } = require('../config/db');
    let queryStr = 'SELECT * FROM job_posts';
    const queryParams = [];
    const clauses = [];
    
    if (conditions.status) {
      queryParams.push(conditions.status);
      clauses.push(`status = $${queryParams.length}`);
    }
    if (conditions.user) {
      queryParams.push(conditions.user);
      clauses.push(`recruiter_id = $${queryParams.length}`);
    }
    if (conditions.isExternal !== undefined) {
      queryParams.push(conditions.isExternal);
      clauses.push(`is_external = $${queryParams.length}`);
    }
    if (conditions._id) {
      queryParams.push(conditions._id);
      clauses.push(`id = $${queryParams.length}`);
    }
    
    if (clauses.length > 0) {
      queryStr += ' WHERE ' + clauses.join(' AND ');
    }
    
    queryStr += ' ORDER BY created_at DESC';
    
    const res = await pool.query(queryStr, queryParams);
    return res.rows.map(mapJobToMongoose);
  };

  return makeJobChainable(execute());
};

const findOne = async (conditions) => {
  if (global.useMockDb) {
    return mockDb.JobPost.findOne(conditions);
  }
  const { pool } = require('../config/db');
  let queryStr = 'SELECT * FROM job_posts';
  const queryParams = [];
  const clauses = [];
  
  if (conditions.externalId) {
    queryParams.push(conditions.externalId);
    clauses.push(`external_id = $${queryParams.length}`);
  }
  if (conditions._id) {
    queryParams.push(conditions._id);
    clauses.push(`id = $${queryParams.length}`);
  }
  
  if (clauses.length > 0) {
    queryStr += ' WHERE ' + clauses.join(' AND ');
  }
  
  const res = await pool.query(queryStr, queryParams);
  if (res.rows.length === 0) return null;
  return mapJobToMongoose(res.rows[0]);
};

const findById = async (id) => {
  if (global.useMockDb) {
    return mockDb.JobPost.findById(id);
  }
  const { pool } = require('../config/db');
  const res = await pool.query('SELECT * FROM job_posts WHERE id = $1', [id]);
  if (res.rows.length === 0) return null;
  return mapJobToMongoose(res.rows[0]);
};

const create = async (fields) => {
  if (global.useMockDb) {
    return mockDb.JobPost.create(fields);
  }
  const { pool } = require('../config/db');
  let recruiterId = fields.user || null;
  
  const res = await pool.query(
    `INSERT INTO job_posts 
     (recruiter_id, title, company_name, company_description, company_logo_url,
      job_type, offering_type, role, experience_type, experience_value,
      tools, description, salary, location, vacancies, hr_email, hr_name,
      skills, languages, custom_questions, is_external, external_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING *`,
    [
      recruiterId,
      fields.title,
      fields.companyName,
      fields.companyDescription,
      fields.companyLogoUrl || null,
      fields.jobType,
      fields.offeringType || 'Job',
      fields.role,
      fields.experienceType,
      Number(fields.experienceValue),
      fields.tools || [],
      fields.description,
      Number(fields.salary),
      fields.location,
      Number(fields.vacancies),
      fields.hrEmail,
      fields.hrName || 'HR Contact',
      fields.skills || [],
      fields.languages || [],
      JSON.stringify(fields.custom_questions || []),
      fields.isExternal || false,
      fields.externalId || null,
      fields.status || 'open'
    ]
  );
  return mapJobToMongoose(res.rows[0]);
};

const findByIdAndDelete = async (id) => {
  if (global.useMockDb) {
    return mockDb.JobPost.findByIdAndDelete(id);
  }
  const { pool } = require('../config/db');
  await pool.query('DELETE FROM job_posts WHERE id = $1', [id]);
  return { _id: id };
};

module.exports = {
  find,
  findOne,
  findById,
  create,
  findByIdAndDelete,
  mapJobToMongoose
};
