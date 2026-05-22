const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB().then(() => {
  // Sync real-time external jobs from OpenRouter on startup and schedule daily updates
  const { fetchRealtimeJobs } = require('./utils/jobFetcher');
  fetchRealtimeJobs();
  // Schedule to run every 24 hours (86400000 ms)
  setInterval(fetchRealtimeJobs, 24 * 60 * 60 * 1000);
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));

// Serve React Client build in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Catch-all route to serve the React index.html for SPA client-side routing
app.get('*', (req, res) => {
  // If the request starts with /api, return a 404 json instead of index.html
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.resolve(clientBuildPath, 'index.html'));
});

// Port configuration
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle server startup errors (e.g., port already in use)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n======================================================`);
    console.error(`[ERROR] Port ${PORT} is already in use by another process!`);
    console.error(`To resolve this, please free port ${PORT} or run the server on a different port:`);
    console.error(`  - On Windows (PowerShell): Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
    console.error(`  - Or set the PORT env variable: PORT=5001 npm start`);
    console.error(`======================================================\n`);
    process.exit(1);
  } else {
    console.error(`Server error: ${err.message}`);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
