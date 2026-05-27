const path = require('path');
const dotenv = require('dotenv');

const serverDir = 'C:/Users/asus/.gemini/antigravity/scratch/jj-just-job/server';

// Load env
dotenv.config({ path: path.join(serverDir, '.env') });

const connectDB = require(path.join(serverDir, 'config/db'));
const JobSeekerProfile = require(path.join(serverDir, 'models/JobSeekerProfile'));

async function testProfileFields() {
  console.log('--- Testing Phase 3 Profile Schema Mapping with Real/Mock DB ---');

  // Initialize DB Connection Pool (will set global.useMockDb correctly)
  await connectDB();
  console.log(`Database connected. Mode: ${global.useMockDb ? 'Mock (db.json)' : 'PostgreSQL'}`);

  const testUserId = 'mock_seeker_field_test_phase3';
  
  // Create a dummy seeker account if we are in PostgreSQL mode
  if (!global.useMockDb) {
    const { pool } = require(path.join(serverDir, 'config/db'));
    // Ensure the seeker user exists in job_seekers table first to avoid FK constraint error
    await pool.query(`
      INSERT INTO job_seekers (id, name, email, password, mobile)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, [
      'd2bb7a82-f542-4b2a-8bf7-5c50c05877f8',
      'Test Seeker Phase 3',
      'candidate.phase3@gmail.com',
      'dummyhashedpassword123',
      '+91 9999988888'
    ]);
  }

  const testProfileData = {
    fullName: 'Test Candidate Phase 3',
    position: 'Graphic Designer',
    experienceType: 'months',
    experienceValue: 12,
    skills: ['Figma', 'Illustrator'],
    tools: ['Figma', 'Canva'],
    gmail: 'candidate.phase3@gmail.com',
    about_them: 'I design interfaces.',
    schooling: 'IIT Bombay - B.Des',
    resumeUrl: '/uploads/resume.pdf',
    photoUrl: '/uploads/photo.jpg',
    workSamples: ['/uploads/s1.jpg', '/uploads/s2.jpg', '/uploads/s3.jpg'],
    relocate: true,
    
    // Phase 3 fields
    mobileNumber: '+91 9999988888',
    joiningDate: '2026-06-01',
    experienceYears: 1,
    experienceMonths: 2,
    school: 'IIT Bombay',
    degree: 'B.Des in Graphic Design',
    location: 'Mumbai, India',
    workMode: 'Hybrid',
    portfolioProjects: [
      { title: 'Project 1', description: 'Design Case Study', link: 'https://behance.net/p1', fileUrl: '/uploads/p1.zip', videoLink: 'https://youtube.com/watch?v=1' },
      { title: 'Project 2', description: 'Landing Page', link: 'https://behance.net/p2', fileUrl: '', videoLink: 'https://youtube.com/watch?v=2' },
      { title: 'Project 3', description: 'Identity Design', link: 'https://behance.net/p3', fileUrl: '/uploads/p3.pdf', videoLink: '' },
      { title: 'Project 4', description: 'Motion Design', link: 'https://behance.net/p4', fileUrl: '/uploads/p4.mp4', videoLink: 'https://youtube.com/watch?v=4' }
    ]
  };

  try {
    const targetUserId = global.useMockDb ? testUserId : 'd2bb7a82-f542-4b2a-8bf7-5c50c05877f8';
    
    // 1. Update/Upsert the profile
    console.log('Upserting test profile with Phase 3 fields...');
    const saved = await JobSeekerProfile.findOneAndUpdate(
      { user: targetUserId },
      testProfileData,
      { new: true, upsert: true }
    );

    console.log('Upsert complete. Retrieving from database...');
    
    // 2. Fetch the profile back
    const retrieved = await JobSeekerProfile.findOne({ user: targetUserId });
    
    if (!retrieved) {
      throw new Error('Profile could not be retrieved from database!');
    }

    console.log('Retrieved profile values:');
    console.log('  FullName:', retrieved.fullName);
    console.log('  MobileNumber:', retrieved.mobileNumber);
    console.log('  JoiningDate:', retrieved.joiningDate);
    console.log('  ExperienceYears:', retrieved.experienceYears);
    console.log('  ExperienceMonths:', retrieved.experienceMonths);
    console.log('  School:', retrieved.school);
    console.log('  Degree:', retrieved.degree);
    console.log('  Location:', retrieved.location);
    console.log('  WorkMode:', retrieved.workMode);
    console.log('  Projects Count:', retrieved.portfolioProjects.length);
    
    // Validate assertions
    if (retrieved.mobileNumber !== testProfileData.mobileNumber) {
      throw new Error(`Mobile number mismatch! Expected ${testProfileData.mobileNumber}, got ${retrieved.mobileNumber}`);
    }
    if (retrieved.school !== testProfileData.school) {
      throw new Error(`School mismatch! Expected ${testProfileData.school}, got ${retrieved.school}`);
    }
    if (retrieved.degree !== testProfileData.degree) {
      throw new Error(`Degree mismatch! Expected ${testProfileData.degree}, got ${retrieved.degree}`);
    }
    if (retrieved.location !== testProfileData.location) {
      throw new Error(`Location mismatch! Expected ${testProfileData.location}, got ${retrieved.location}`);
    }
    if (retrieved.workMode !== testProfileData.workMode) {
      throw new Error(`WorkMode mismatch! Expected ${testProfileData.workMode}, got ${retrieved.workMode}`);
    }
    if (retrieved.portfolioProjects.length !== 4) {
      throw new Error(`Projects count mismatch! Expected 4, got ${retrieved.portfolioProjects.length}`);
    }
    if (retrieved.portfolioProjects[3].videoLink !== 'https://youtube.com/watch?v=4') {
      throw new Error(`Project 4 videoLink mismatch! Expected https://youtube.com/watch?v=4, got ${retrieved.portfolioProjects[3].videoLink}`);
    }

    console.log('\n✅ PHASE 3 SCHEMA AND DB INTEGRITY TESTING SUCCESSFUL! ✅');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 3 DB TEST FAILED:', err.message);
    process.exit(1);
  }
}

testProfileFields();
