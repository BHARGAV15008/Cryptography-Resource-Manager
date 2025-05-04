const express = require('express');
const cors = require('cors');
const { connectDB, executeQuery } = require('./config/db');

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Initialize database connection
async function initializeApp() {
  try {
    // Connect to the database
    await connectDB();
    console.log('Database connection established');
    
    // Start the server
    const PORT = 5002; // Using a different port to avoid conflicts
    app.listen(PORT, () => {
      console.log(`Test API server running on port ${PORT}`);
      console.log(`Try accessing: http://localhost:${PORT}/api/test`);
      console.log(`Try accessing: http://localhost:${PORT}/api/courses`);
    });
  } catch (err) {
    console.error('Failed to initialize app:', err);
    process.exit(1);
  }
}

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Test courses route
app.get('/api/courses', async (req, res) => {
  try {
    console.log('Fetching courses...');
    const courses = await executeQuery(`
      SELECT c.*, p.name as professor_name 
      FROM courses c
      LEFT JOIN professors p ON c.professor_id = p.id
      ORDER BY c.created_at DESC
    `);
    
    console.log('Courses fetched:', courses.length);
    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Initialize the app
initializeApp();
