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

module.exports = {
  appendToExcel
};
