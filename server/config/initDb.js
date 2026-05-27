const initDb = async (pool) => {
  const client = await pool.connect();
  try {
    console.log('[initDb] Starting Supabase PostgreSQL database table checks...');
    
    // Enable uuid-ossp extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Table 1: job_seekers
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_seekers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        mobile_verified BOOLEAN DEFAULT FALSE,
        email_otp VARCHAR(10),
        mobile_otp VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table 2: hiring_managers
    await client.query(`
      CREATE TABLE IF NOT EXISTS hiring_managers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        mobile_verified BOOLEAN DEFAULT FALSE,
        email_otp VARCHAR(10),
        mobile_otp VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table 3: job_posts
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        recruiter_id UUID REFERENCES hiring_managers(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        company_description TEXT NOT NULL,
        company_logo_url TEXT,
        job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('Remote', 'On-site', 'Hybrid')),
        offering_type VARCHAR(50) NOT NULL CHECK (offering_type IN ('Internship', 'Internship + PPO', 'Job')),
        role VARCHAR(100) NOT NULL CHECK (role IN ('Graphic Designer', 'UI/UX Designer', 'Motion Graphic Designer')),
        experience_type VARCHAR(50) NOT NULL CHECK (experience_type IN ('months', 'years')),
        experience_value INTEGER NOT NULL,
        tools TEXT[] NOT NULL,
        description TEXT NOT NULL,
        salary INTEGER NOT NULL CHECK (salary >= 12000),
        location VARCHAR(255) NOT NULL,
        vacancies INTEGER NOT NULL CHECK (vacancies >= 1),
        hr_email VARCHAR(255) NOT NULL,
        hr_name VARCHAR(255) NOT NULL,
        skills TEXT[] DEFAULT '{}',
        languages TEXT[] DEFAULT '{}',
        custom_questions JSONB DEFAULT '[]'::jsonb,
        is_external BOOLEAN DEFAULT FALSE,
        external_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paused')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table 4: job_seeker_profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_seeker_profiles (
        seeker_id UUID PRIMARY KEY REFERENCES job_seekers(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        position VARCHAR(100) NOT NULL CHECK (position IN ('Graphic Designer', 'UI/UX Designer', 'Motion Graphic Designer')),
        experience_type VARCHAR(50) NOT NULL CHECK (experience_type IN ('months', 'years')),
        experience_value INTEGER NOT NULL,
        skills TEXT[] NOT NULL,
        tools TEXT[] NOT NULL,
        gmail VARCHAR(255) NOT NULL,
        about_them TEXT NOT NULL,
        schooling TEXT NOT NULL,
        resume_url TEXT NOT NULL,
        photo_url TEXT NOT NULL,
        work_samples TEXT[] NOT NULL,
        portfolio_projects JSONB NOT NULL DEFAULT '[]'::jsonb,
        website_link TEXT,
        languages JSONB NOT NULL DEFAULT '[]'::jsonb,
        relocate BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure new columns exist on job_seeker_profiles for updated fields
    await client.query('ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50)');
    await client.query('ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS joining_date VARCHAR(50)');
    await client.query('ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0');
    await client.query('ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS experience_months INTEGER DEFAULT 0');

    // Table 5: applications
    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID REFERENCES job_posts(id) ON DELETE CASCADE,
        seeker_id UUID REFERENCES job_seekers(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cracked')),
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_id, seeker_id)
      )
    `);

    // Table 6: login_activities
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_activities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[initDb] All tables created or verified successfully!');
  } catch (error) {
    console.error('[initDb] Error initializing database tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = initDb;
