const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../verified_users.csv');

/**
 * Appends a verified user record to the verified_users.csv file
 * @param {string} name 
 * @param {string} email 
 * @param {string} role 
 */
const appendToExcel = async (name, email, role) => {
  try {
    const header = 'Name,Email,Role,Verification Status,Verified At\n';
    const cleanName = name.replace(/,/g, ''); // strip commas to avoid CSV parsing issues
    const roleText = role === 'seeker' ? 'Job Seeker' : 'Hiring Manager';
    const timestamp = new Date().toISOString();
    const row = `"${cleanName}","${email}","${roleText}","Verified","${timestamp}"\n`;

    const exists = fs.existsSync(filePath);
    if (!exists) {
      fs.writeFileSync(filePath, header + row);
      console.log(`[Excel Logger] Created verified registry sheet and added: ${email}`);
    } else {
      fs.appendFileSync(filePath, row);
      console.log(`[Excel Logger] Added user to verified registry: ${email}`);
    }
  } catch (err) {
    console.error('[Excel Logger] Error logging verified user:', err.message);
  }
};

/**
 * Logs a successful user login event to login_activities.csv and database
 * @param {string} name 
 * @param {string} email 
 * @param {string} role 
 * @param {string} userId 
 */
const logLogin = async (name, email, role, userId) => {
  try {
    const header = 'Name,Email,Role,Login Time\n';
    const cleanName = name.replace(/,/g, '');
    const roleText = role === 'seeker' ? 'Job Seeker' : 'Hiring Manager';
    const timestamp = new Date().toISOString();
    const row = `"${cleanName}","${email}","${roleText}","${timestamp}"\n`;

    // 1. Log to CSV sheet
    const loginCsvPath = path.join(__dirname, '../../login_activities.csv');
    const exists = fs.existsSync(loginCsvPath);
    if (!exists) {
      fs.writeFileSync(loginCsvPath, header + row);
    } else {
      fs.appendFileSync(loginCsvPath, row);
    }
    console.log(`[Excel Logger] Recorded login for user: ${email} inside login_activities.csv`);

    // 2. Log to Database
    if (global.useMockDb) {
      // Direct update to local db.json
      const dbPath = path.join(__dirname, '../db.json');
      if (fs.existsSync(dbPath)) {
        try {
          const fileData = fs.readFileSync(dbPath, 'utf8');
          const dbData = JSON.parse(fileData);
          if (!dbData.login_activities) {
            dbData.login_activities = [];
          }
          dbData.login_activities.push({
            id: 'mock_log_' + Math.random().toString(36).substr(2, 9),
            userId: userId ? userId.toString() : '',
            name,
            email,
            role,
            loginTime: timestamp
          });
          fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
        } catch (e) {
          console.error('[Excel Logger] Error updating mock db.json with login:', e.message);
        }
      }
    } else {
      // Update to Supabase PostgreSQL table
      const { pool } = require('../config/db');
      await pool.query(
        `INSERT INTO login_activities (user_id, email, role) VALUES ($1, $2, $3)`,
        [userId, email, role]
      );
      console.log(`[Excel Logger] Recorded login for user: ${email} inside PostgreSQL login_activities table`);
    }
  } catch (err) {
    console.error('[Excel Logger] Error logging user login:', err.message);
  }
};

module.exports = {
  appendToExcel,
  logLogin
};
