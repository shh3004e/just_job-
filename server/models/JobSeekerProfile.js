const mockDb = require('../utils/mockDb');

const mapProfileToMongoose = (profile) => {
  if (!profile) return null;
  
  // Safe JSON parse for array fields
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

  return {
    _id: profile.seeker_id,
    id: profile.seeker_id,
    user: profile.seeker_id,
    fullName: profile.full_name,
    position: profile.position,
    experienceType: profile.experience_type,
    experienceValue: profile.experience_value,
    skills: profile.skills || [],
    tools: profile.tools || [],
    gmail: profile.gmail,
    about_them: profile.about_them,
    schooling: profile.schooling,
    resumeUrl: profile.resume_url,
    photoUrl: profile.photo_url,
    workSamples: profile.work_samples || [],
    portfolioProjects: parseJsonField(profile.portfolio_projects),
    portfolioUrl: profile.website_link || '',
    languages: parseJsonField(profile.languages),
    relocate: profile.relocate || false,
    createdAt: profile.created_at,
    mobileNumber: profile.mobile_number || profile.mobileNumber || '',
    joiningDate: profile.joining_date || profile.joiningDate || '',
    experienceYears: profile.experience_years !== undefined ? Number(profile.experience_years) : (profile.experienceYears !== undefined ? Number(profile.experienceYears) : 0),
    experienceMonths: profile.experience_months !== undefined ? Number(profile.experience_months) : (profile.experienceMonths !== undefined ? Number(profile.experienceMonths) : 0),
    school: profile.school || profile.schooling || '',
    degree: profile.degree || '',
    location: profile.location || '',
    workMode: profile.work_mode || profile.workMode || 'Remote'
  };
};

const findOne = async (conditions) => {
  if (global.useMockDb) {
    return mockDb.JobSeekerProfile.findOne(conditions);
  }
  const { pool } = require('../config/db');
  
  let seekerId = conditions.user;
  if (conditions.seeker_id) seekerId = conditions.seeker_id;
  if (conditions._id) seekerId = conditions._id;
  
  if (!seekerId) return null;

  const res = await pool.query('SELECT * FROM job_seeker_profiles WHERE seeker_id = $1', [seekerId]);
  if (res.rows.length === 0) return null;
  
  return mapProfileToMongoose(res.rows[0]);
};

const findOneAndUpdate = async (query, updateData, options = {}) => {
  if (global.useMockDb) {
    return mockDb.JobSeekerProfile.findOneAndUpdate(query, updateData, options);
  }
  const { pool } = require('../config/db');
  const userId = query.user;
  
  if (!userId) throw new Error('Query user ID is required');

  // Check if profile exists
  const checkRes = await pool.query('SELECT * FROM job_seeker_profiles WHERE seeker_id = $1', [userId]);
  const exists = checkRes.rows.length > 0;
  
  let res;
  if (exists) {
    res = await pool.query(
      `UPDATE job_seeker_profiles 
       SET full_name = $1, position = $2, experience_type = $3, experience_value = $4, 
           skills = $5, tools = $6, gmail = $7, about_them = $8, schooling = $9, 
           resume_url = $10, photo_url = $11, work_samples = $12, portfolio_projects = $13, 
           website_link = $14, languages = $15, relocate = $16,
           mobile_number = $17, joining_date = $18, experience_years = $19, experience_months = $20,
           school = $21, degree = $22, location = $23, work_mode = $24
       WHERE seeker_id = $25 RETURNING *`,
      [
        updateData.fullName,
        updateData.position,
        updateData.experienceType || 'months',
        Number(updateData.experienceValue || 0),
        updateData.skills || [],
        updateData.tools || [],
        updateData.gmail,
        updateData.about_them || '',
        updateData.school || updateData.schooling || '',
        updateData.resumeUrl,
        updateData.photoUrl,
        updateData.workSamples || [],
        JSON.stringify(updateData.portfolioProjects || []),
        updateData.portfolioUrl || '',
        JSON.stringify(updateData.languages || []),
        updateData.relocate || false,
        updateData.mobileNumber || '',
        updateData.joiningDate || '',
        Number(updateData.experienceYears || 0),
        Number(updateData.experienceMonths || 0),
        updateData.school || '',
        updateData.degree || '',
        updateData.location || '',
        updateData.workMode || 'Remote',
        userId
      ]
    );
  } else {
    res = await pool.query(
      `INSERT INTO job_seeker_profiles 
       (seeker_id, full_name, position, experience_type, experience_value, 
        skills, tools, gmail, about_them, schooling, 
        resume_url, photo_url, work_samples, portfolio_projects, 
        website_link, languages, relocate, mobile_number, joining_date, experience_years, experience_months,
        school, degree, location, work_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25) RETURNING *`,
      [
        userId,
        updateData.fullName,
        updateData.position,
        updateData.experienceType || 'months',
        Number(updateData.experienceValue || 0),
        updateData.skills || [],
        updateData.tools || [],
        updateData.gmail,
        updateData.about_them || '',
        updateData.school || updateData.schooling || '',
        updateData.resumeUrl,
        updateData.photoUrl,
        updateData.workSamples || [],
        JSON.stringify(updateData.portfolioProjects || []),
        updateData.portfolioUrl || '',
        JSON.stringify(updateData.languages || []),
        updateData.relocate || false,
        updateData.mobileNumber || '',
        updateData.joiningDate || '',
        Number(updateData.experienceYears || 0),
        Number(updateData.experienceMonths || 0),
        updateData.school || '',
        updateData.degree || '',
        updateData.location || '',
        updateData.workMode || 'Remote'
      ]
    );
  }
  
  return mapProfileToMongoose(res.rows[0]);
};

module.exports = {
  findOne,
  findOneAndUpdate,
  mapProfileToMongoose
};
