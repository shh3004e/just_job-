const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const { protect } = require('../middleware/authMiddleware');
const { sendRegistrationOtp } = require('../utils/mailer');
const { appendToExcel } = require('../utils/excelLogger');

// JWT signer helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjjjustjobtoken12345!', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, mobile } = req.body;

    if (!name || !email || !password || !role || !mobile) {
      return res.status(400).json({ success: false, message: 'Please fill in all registration fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Generate numeric 6-digit OTPs
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      mobile,
      email_otp: emailOtp,
      mobile_otp: mobileOtp,
      email_verified: false,
      mobile_verified: false
    });

    // Send OTP verification email in background
    sendRegistrationOtp(email, name, emailOtp, mobileOtp).catch(err => {
      console.error('Background email sending failed:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Verification OTP codes have been sent.',
      tempUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      devHelper: {
        emailOtp,
        mobileOtp
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password presence
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Block unverified users from logging in
    if (!user.email_verified || !user.mobile_verified) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify your OTP codes first.',
        isNotVerified: true,
        email: user.email,
        role: user.role,
        devHelper: {
          emailOtp: user.email_otp,
          mobileOtp: user.mobile_otp
        }
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Verify OTP codes
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, role, emailOtp, mobileOtp } = req.body;

    if (!email || !role || !emailOtp || !mobileOtp) {
      return res.status(400).json({ success: false, message: 'Please provide all details and verification codes' });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== role) {
      return res.status(404).json({ success: false, message: 'Account registry not found' });
    }

    if (user.email_otp !== emailOtp || user.mobile_otp !== mobileOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP codes. Please double check.' });
    }

    // Mark verified
    user.email_verified = true;
    user.mobile_verified = true;
    await user.save();

    // Log to Excel registry sheet
    await appendToExcel(user.name, user.email, user.role);

    // Generate token now
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const https = require('https');

const verifyGoogleToken = (token) => {
  return new Promise((resolve, reject) => {
    https.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// @desc    Google Sign-In
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Please provide Google credential token' });
    }

    let email, name, picture;

    // Check if mock token
    if (credential.startsWith('mock_google_token_')) {
      email = credential.replace('mock_google_token_', '');
      name = email.split('@')[0];
      name = name.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      picture = `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`;
    } else {
      // Real verification via Google Tokeninfo API
      try {
        const data = await verifyGoogleToken(credential);
        if (data.error_description || data.error) {
          return res.status(400).json({ success: false, message: 'Google token verification failed: ' + (data.error_description || data.error) });
        }
        email = data.email;
        name = data.name;
        picture = data.picture;
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Failed to verify Google token: ' + err.message });
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address not found in Google account profile' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    const isNewUser = !user;
    
    if (isNewUser) {
      const userRole = role || 'seeker';
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      
      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: userRole,
        mobile: '',
        email_otp: '',
        mobile_otp: '',
        email_verified: true,
        mobile_verified: true
      });

      // Log immediately to Excel registry sheet
      await appendToExcel(name, email, userRole);
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: picture || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user session
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = null;

    if (user.role === 'seeker') {
      profile = await JobSeekerProfile.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      profile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
