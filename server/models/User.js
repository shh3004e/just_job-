const mockDb = require('../utils/mockDb');

const makeChainable = (promise) => {
  promise.select = function() {
    return this;
  };
  return promise;
};

const findOne = (conditions) => {
  const execute = async () => {
    if (global.useMockDb) {
      return mockDb.User.findOne(conditions);
    }
    
    const { pool } = require('../config/db');
    if (conditions.email) {
      const email = conditions.email.toLowerCase().trim();
      
      // 1. Check job_seekers
      let res = await pool.query('SELECT * FROM job_seekers WHERE email = $1', [email]);
      if (res.rows.length > 0) {
        const userObj = res.rows[0];
        userObj.role = 'seeker';
        userObj._id = userObj.id;
        userObj.matchPassword = async (entered) => {
          const bcrypt = require('bcryptjs');
          return await bcrypt.compare(entered, userObj.password);
        };
        userObj.save = async () => {
          await pool.query(
            `UPDATE job_seekers 
             SET name = $1, email = $2, password = $3, mobile = $4, 
                 email_verified = $5, mobile_verified = $6, email_otp = $7, mobile_otp = $8 
             WHERE id = $9`,
            [userObj.name, userObj.email, userObj.password, userObj.mobile, userObj.email_verified, userObj.mobile_verified, userObj.email_otp, userObj.mobile_otp, userObj.id]
          );
          return userObj;
        };
        return userObj;
      }
      
      // 2. Check hiring_managers
      res = await pool.query('SELECT * FROM hiring_managers WHERE email = $1', [email]);
      if (res.rows.length > 0) {
        const userObj = res.rows[0];
        userObj.role = 'recruiter';
        userObj._id = userObj.id;
        userObj.matchPassword = async (entered) => {
          const bcrypt = require('bcryptjs');
          return await bcrypt.compare(entered, userObj.password);
        };
        userObj.save = async () => {
          await pool.query(
            `UPDATE hiring_managers 
             SET name = $1, email = $2, password = $3, mobile = $4, 
                 email_verified = $5, mobile_verified = $6, email_otp = $7, mobile_otp = $8 
             WHERE id = $9`,
            [userObj.name, userObj.email, userObj.password, userObj.mobile, userObj.email_verified, userObj.mobile_verified, userObj.email_otp, userObj.mobile_otp, userObj.id]
          );
          return userObj;
        };
        return userObj;
      }
    }
    return null;
  };

  return makeChainable(execute());
};

const findById = (id) => {
  const execute = async () => {
    if (global.useMockDb) {
      return mockDb.User.findById(id);
    }
    const { pool } = require('../config/db');
    
    // 1. Check job_seekers
    let res = await pool.query('SELECT * FROM job_seekers WHERE id = $1', [id]);
    if (res.rows.length > 0) {
      const userObj = res.rows[0];
      userObj.role = 'seeker';
      userObj._id = userObj.id;
      userObj.matchPassword = async (entered) => {
        const bcrypt = require('bcryptjs');
        return await bcrypt.compare(entered, userObj.password);
      };
      userObj.save = async () => {
        await pool.query(
          `UPDATE job_seekers 
           SET name = $1, email = $2, password = $3, mobile = $4, 
               email_verified = $5, mobile_verified = $6, email_otp = $7, mobile_otp = $8 
           WHERE id = $9`,
          [userObj.name, userObj.email, userObj.password, userObj.mobile, userObj.email_verified, userObj.mobile_verified, userObj.email_otp, userObj.mobile_otp, userObj.id]
        );
        return userObj;
      };
      return userObj;
    }
    
    // 2. Check hiring_managers
    res = await pool.query('SELECT * FROM hiring_managers WHERE id = $1', [id]);
    if (res.rows.length > 0) {
      const userObj = res.rows[0];
      userObj.role = 'recruiter';
      userObj._id = userObj.id;
      userObj.matchPassword = async (entered) => {
        const bcrypt = require('bcryptjs');
        return await bcrypt.compare(entered, userObj.password);
      };
      userObj.save = async () => {
        await pool.query(
          `UPDATE hiring_managers 
           SET name = $1, email = $2, password = $3, mobile = $4, 
               email_verified = $5, mobile_verified = $6, email_otp = $7, mobile_otp = $8 
           WHERE id = $9`,
          [userObj.name, userObj.email, userObj.password, userObj.mobile, userObj.email_verified, userObj.mobile_verified, userObj.email_otp, userObj.mobile_otp, userObj.id]
        );
        return userObj;
      };
      return userObj;
    }
    return null;
  };

  return makeChainable(execute());
};

const create = async (fields) => {
  if (global.useMockDb) {
    return mockDb.User.create(fields);
  }
  const { pool } = require('../config/db');
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(fields.password, salt);
  
  const email = fields.email.toLowerCase().trim();
  const table = fields.role === 'recruiter' ? 'hiring_managers' : 'job_seekers';
  
  const res = await pool.query(
    `INSERT INTO ${table} (name, email, password, mobile, email_otp, mobile_otp, email_verified, mobile_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      fields.name,
      email,
      hashedPassword,
      fields.mobile || '',
      fields.email_otp || '',
      fields.mobile_otp || '',
      fields.email_verified || false,
      fields.mobile_verified || false
    ]
  );
  
  const userObj = res.rows[0];
  userObj.role = fields.role;
  userObj._id = userObj.id;
  userObj.matchPassword = async (entered) => {
    return await bcrypt.compare(entered, userObj.password);
  };
  userObj.save = async () => {
    await pool.query(
      `UPDATE ${table} 
       SET name = $1, email = $2, password = $3, mobile = $4, 
           email_verified = $5, mobile_verified = $6, email_otp = $7, mobile_otp = $8 
       WHERE id = $9`,
      [userObj.name, userObj.email, userObj.password, userObj.mobile, userObj.email_verified, userObj.mobile_verified, userObj.email_otp, userObj.mobile_otp, userObj.id]
    );
    return userObj;
  };
  return userObj;
};

module.exports = {
  findOne,
  findById,
  create
};
