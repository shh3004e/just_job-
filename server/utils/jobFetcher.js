const crypto = require('crypto');
const User = require('../models/User');
const JobPost = require('../models/JobPost');
const Application = require('../models/Application');

/**
 * Automatically clean up expired external jobs (older than 12 hours)
 * and close jobs that have filled their vacancies.
 */
const cleanupJobs = async () => {
  try {
    console.log('[Job Fetcher Cleanup] Starting job listing audit...');
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    // 1. Process external jobs
    const currentExternalJobs = await JobPost.find({ isExternal: true });
    let deletedCount = 0;
    let closedCount = 0;
    let keptCount = 0;

    for (const job of currentExternalJobs) {
      const appCount = await Application.countDocuments({ job: job._id });
      const activeAppsCount = await Application.countDocuments({
        job: job._id,
        status: { $in: ['accepted', 'pending'] }
      });
      const jobCreatedAt = new Date(job.createdAt);
      const isOld = jobCreatedAt < twelveHoursAgo;
      const isVacancyFull = activeAppsCount >= job.vacancies;

      if (isOld) {
        // Delete if 0 applications OR if vacancy limit is full
        if (appCount === 0 || isVacancyFull) {
          await JobPost.findByIdAndDelete(job._id);
          // Delete associated applications
          await Application.deleteMany({ job: job._id });
          deletedCount++;
        } else if (job.status !== 'closed') {
          // Close if it has applications but vacancies aren't full
          job.status = 'closed';
          await job.save();
          closedCount++;
        } else {
          keptCount++;
        }
      } else {
        // If fresh (<12h) but vacancies are full, close it
        if (isVacancyFull) {
          if (job.status !== 'closed') {
            job.status = 'closed';
            await job.save();
            closedCount++;
          } else {
            keptCount++;
          }
        } else {
          keptCount++;
        }
      }
    }
    console.log(`[Job Fetcher Cleanup] External jobs: Deleted ${deletedCount} old/full, closed ${closedCount} full/old with apps, kept ${keptCount} fresh.`);

    // 2. Audit recruiter-posted open jobs (isExternal: false) for full vacancies
    const openRecruiterJobs = await JobPost.find({ status: 'open', isExternal: false });
    let autoClosedRecruiterCount = 0;

    for (const job of openRecruiterJobs) {
      const activeAppsCount = await Application.countDocuments({
        job: job._id,
        status: { $in: ['accepted', 'pending'] }
      });
      if (activeAppsCount >= job.vacancies) {
        job.status = 'closed';
        await job.save();
        autoClosedRecruiterCount++;
        console.log(`[Job Fetcher Cleanup] Auto-closed recruiter job "${job.title}" by ${job.companyName} due to full vacancies (${activeAppsCount}/${job.vacancies}).`);
      }
    }
    console.log(`[Job Fetcher Cleanup] Recruiter jobs vacancy audit: Auto-closed ${autoClosedRecruiterCount} full-vacancy recruiter jobs.`);
  } catch (error) {
    console.error('[Job Fetcher Cleanup] Error during cleanup:', error.message);
  }
};

/**
 * Fetch and import design jobs from OpenRouter using Gemini 2.5
 */
const fetchRealtimeJobs = async () => {
  try {
    console.log('[Job Fetcher] Starting daily external jobs sync...');

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn('[Job Fetcher] OPENROUTER_API_KEY is not defined in environment variables. Skipping sync.');
      return;
    }

    // 1. Ensure the OpenRouter bot user exists
    const botEmail = 'openrouter.bot@jjjustjob.com';
    let botUser = await User.findOne({ email: botEmail });
    if (!botUser) {
      console.log('[Job Fetcher] Creating Bot Recruiter user account...');
      botUser = await User.create({
        name: 'OpenRouter Jobs Bot',
        email: botEmail,
        password: crypto.randomBytes(16).toString('hex'),
        role: 'recruiter'
      });
      console.log(`[Job Fetcher] Bot Recruiter created with ID: ${botUser._id}`);
    } else {
      console.log(`[Job Fetcher] Bot Recruiter account found (ID: ${botUser._id})`);
    }

    // 2. Fetch new jobs from OpenRouter
    const currentDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `You are a real-time job scanner assistant. Your goal is to return a list of 8 to 12 real, active, and fresh job postings in India (or Remote) for creative designers. Today's date is ${currentDateStr}.
Fetch or generate high-quality job postings matching these rules:
1. Target Roles: Only Graphic Designer, UI/UX Designer, or Motion Graphic Designer.
2. Freshness: The posting must be fresh (posted today or within the last 1-2 days).
3. Salary: Monthly salary in INR must be a number NOT less than 12000 (e.g., 25000, 30000, etc.).
4. Vacancies: Number of vacancies must be between 1 and 20. Do NOT exceed 20 vacancies.
5. Experience: Fresher level only (0-11 months, or 0-1 years).
   - If experienceType is "months", experienceValue must be between 0 and 11.
   - If experienceType is "years", experienceValue must be 0 or 1.
6. Tools: List relevant software tools (e.g. Photoshop, Figma, After Effects, Illustrator, Blender, Cinema 4D).
7. Location: Specify a realistic city (e.g. Bangalore, Mumbai, Delhi, Hyderabad) or "Remote".
8. jobType: Must be exactly "Remote", "On-site", or "Hybrid".
9. Details: Provide a realistic companyName, companyDescription, detailed role description, valid hrEmail, and a unique externalId.

Format the response strictly as a JSON object with a single key "jobs" containing an array of job objects:
{
  "jobs": [
    {
      "title": "Junior UI/UX Designer",
      "companyName": "TechVantage Studio",
      "companyDescription": "A boutique product design agency.",
      "jobType": "Remote",
      "role": "UI/UX Designer",
      "experienceType": "years",
      "experienceValue": 1,
      "tools": ["Figma", "Framer", "Adobe XD"],
      "description": "We are seeking a Junior UI/UX Designer to design mobile app mockups and interactive prototypes. You will collaborate with product managers.",
      "salary": 32000,
      "location": "Remote",
      "vacancies": 3,
      "hrEmail": "recruitment@techvantage.io",
      "externalId": "or_jv_uiux_001"
    }
  ]
}
Do not include any introductory or concluding text. Return only the JSON object.`;

    console.log('[Job Fetcher] Requesting fresh job listings from OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'JJ Just Job Portal'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 6000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API responded with status ${response.status}: ${errText}`);
    }

    const resJson = await response.json();
    let modelText = resJson.choices?.[0]?.message?.content;
    if (!modelText) {
      throw new Error('Received empty completions message from OpenRouter.');
    }

    // Clean potential markdown tags from LLM response
    modelText = modelText.trim();
    if (modelText.startsWith('```json')) {
      modelText = modelText.substring(7);
    } else if (modelText.startsWith('```')) {
      modelText = modelText.substring(3);
    }
    if (modelText.endsWith('```')) {
      modelText = modelText.substring(0, modelText.length - 3);
    }
    modelText = modelText.trim();

    const parsedData = JSON.parse(modelText);
    const fetchedJobs = parsedData.jobs || [];
    console.log(`[Job Fetcher] Successfully parsed ${fetchedJobs.length} external job postings from OpenRouter API.`);

    // 3. Clean up old external jobs and audit vacancies
    await cleanupJobs();

    // 4. Save newly fetched valid jobs
    let importedCount = 0;
    for (const job of fetchedJobs) {
      // Validate constraints strictly
      const isValidRole = ['Graphic Designer', 'UI/UX Designer', 'Motion Graphic Designer'].includes(job.role);
      const isSalaryValid = Number(job.salary) >= 12000;
      const isVacancyValid = Number(job.vacancies) >= 1 && Number(job.vacancies) <= 20;
      
      let isExperienceValid = false;
      const expVal = Number(job.experienceValue);
      if (job.experienceType === 'months') {
        isExperienceValid = expVal >= 0 && expVal <= 11;
      } else if (job.experienceType === 'years') {
        isExperienceValid = expVal >= 0 && expVal <= 1;
      }

      if (!isValidRole || !isSalaryValid || !isVacancyValid || !isExperienceValid) {
        console.warn(`[Job Fetcher] Skipping invalid job post: "${job.title}" by ${job.companyName}. Reason: Constraint validation failed.`);
        continue;
      }

      // Avoid duplication if the same external ID exists
      const duplicate = await JobPost.findOne({ externalId: job.externalId });
      if (duplicate) {
        console.log(`[Job Fetcher] External job "${job.title}" already imported (ID: ${duplicate._id}). Skipping.`);
        continue;
      }

      // Save new job
      await JobPost.create({
        user: botUser._id,
        title: job.title,
        companyName: job.companyName,
        companyDescription: job.companyDescription,
        jobType: job.jobType,
        role: job.role,
        experienceType: job.experienceType,
        experienceValue: expVal,
        tools: job.tools || [],
        description: job.description,
        salary: Number(job.salary),
        location: job.location,
        vacancies: Number(job.vacancies),
        hrEmail: job.hrEmail,
        isExternal: true,
        externalId: job.externalId,
        status: 'open',
        createdAt: new Date()
      });
      importedCount++;
    }

    console.log(`[Job Fetcher] Daily sync complete. Imported ${importedCount} new external job listings.`);
  } catch (error) {
    console.error('[Job Fetcher] Error during OpenRouter jobs fetch:', error.message);
  }
};

module.exports = {
  fetchRealtimeJobs,
  cleanupJobs
};
