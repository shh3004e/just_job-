const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const { protect } = require('../middleware/authMiddleware');

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
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    const token = generateToken(user._id);

    res.status(201).json({
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
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
        role: userRole
      });
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
