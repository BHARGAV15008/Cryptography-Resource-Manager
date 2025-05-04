const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// For static files (uploads, etc.)
app.use(express.static('uploads'));
app.use('/uploads', express.static('uploads'));

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'cryptography_resources',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Simple query function
const executeQuery = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Simple auth middleware
const verifyToken = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');
  console.log('Token provided:', token ? 'Yes' : 'No');
  
  // For this simplified server, we'll accept any token
  // In a real app, you'd verify the token properly
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Simulate attaching user data to request
  req.user = {
    id: 1,
    firstName: 'Mock',
    lastName: 'User',
    email: 'admin@example.com',
    role: 'admin'
  };
  
  next();
};

// Log all requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// Auth routes
// GET /api/auth/profile
app.get('/api/auth/profile', verifyToken, (req, res) => {
  console.log('Profile endpoint accessed');
  res.json({
    user: req.user,
    permissions: ['manage_courses', 'manage_lectures', 'manage_projects', 'manage_professors']
  });
});

// Mock login endpoint for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt: ${email}`);
  
  // Return mock user data
  res.json({
    id: 1,
    firstName: 'Mock',
    lastName: 'User',
    email: email || 'admin@example.com',
    token: 'mock-jwt-token-for-development-only',
    role: 'admin',
    redirectTo: '/dashboard'
  });
});

// GET all courses
app.get('/api/courses', async (req, res) => {
  try {
    console.log('Fetching courses...');
    const courses = await executeQuery(`
      SELECT c.*, p.name as professor_name 
      FROM courses c
      LEFT JOIN professors p ON c.professor_id = p.id
      ORDER BY c.created_at DESC
    `);
    
    console.log(`Courses fetched: ${courses.length}`);
    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET lectures by course ID
app.get('/api/lectures/course/:courseId', async (req, res) => {
  try {
    console.log(`Fetching lectures for course ID: ${req.params.courseId}`);
    const lectures = await executeQuery(
      'SELECT * FROM lectures WHERE course_id = ? ORDER BY lecture_date ASC',
      [req.params.courseId]
    );
    
    console.log(`Lectures fetched: ${lectures.length}`);
    res.json(lectures);
  } catch (err) {
    console.error('Error fetching course lectures:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET lecture by ID
app.get('/api/lectures/:id', async (req, res) => {
  try {
    console.log(`Fetching lecture with ID: ${req.params.id}`);
    const [lecture] = await executeQuery(
      'SELECT l.*, c.title as course_title FROM lectures l LEFT JOIN courses c ON l.course_id = c.id WHERE l.id = ?',
      [req.params.id]
    );
    
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }
    
    res.json(lecture);
  } catch (err) {
    console.error('Error fetching lecture:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET all lectures
app.get('/api/lectures', async (req, res) => {
  try {
    console.log('Fetching all lectures...');
    const lectures = await executeQuery(`
      SELECT l.*, c.title as course_title 
      FROM lectures l
      LEFT JOIN courses c ON l.course_id = c.id
      ORDER BY l.lecture_date DESC
    `);
    
    console.log(`Lectures fetched: ${lectures.length}`);
    res.json(lectures);
  } catch (err) {
    console.error('Error fetching lectures:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ message: 'API endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/api/courses`);
  console.log(`Try accessing: http://localhost:${PORT}/api/lectures`);
});
