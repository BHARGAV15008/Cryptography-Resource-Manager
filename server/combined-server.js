const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('uploads'));
app.use('/uploads', express.static('uploads'));

// Create a connection pool
let pool = null;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'cryptography_resources',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('Database pool created successfully');
} catch (error) {
  console.error('Error creating database pool:', error.message);
  console.log('Continuing without database connection');
}

// Simple query function
const executeQuery = async (sql, params = []) => {
  if (!pool) {
    console.warn('Database pool not available, returning empty result');
    return [];
  }
  
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
};

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Simple auth middleware
const verifyToken = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');
  console.log('Token provided:', token ? 'Yes' : 'No');
  
  // For this simplified server, we'll accept any token
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

// Auth routes
app.get('/api/auth/profile', verifyToken, (req, res) => {
  console.log('Profile endpoint accessed');
  res.json({
    user: req.user,
    permissions: ['manage_courses', 'manage_lectures', 'manage_projects', 'manage_professors']
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt: ${email || 'unknown'}`);
  
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

// Courses routes
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

// POST create a new course
app.post('/api/courses', verifyToken, async (req, res) => {
  try {
    console.log('Adding new course...');
    console.log('Request body:', req.body);
    
    // Map client-side field names to server-side field names
    // The client sends 'name' but the server expects 'title'
    const { name, description } = req.body;
    const title = name; // Use name as title
    const createdBy = req.user.id;
    
    // Handle file upload (if needed)
    // For now, we'll just simulate successful course creation
    
    // Simulate inserting into the database
    // In a real implementation, we would use executeQuery here
    const result = {
      insertId: Math.floor(Math.random() * 1000) + 1 // Simulate an insert ID
    };
    
    console.log(`Course created with ID: ${result.insertId}`);
    res.status(201).json({ 
      message: 'Course created successfully',
      courseId: result.insertId
    });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Lectures routes
app.get('/api/lectures', async (req, res) => {
  try {
    console.log('Fetching lectures...');
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

// POST create a new lecture
app.post('/api/lectures', verifyToken, async (req, res) => {
  try {
    console.log('Adding new lecture...');
    console.log('Request body:', req.body);
    
    const { title, course_id, lecture_date, description, slides_url, video_url, additional_resources } = req.body;
    const createdBy = req.user.id;
    
    // Handle file upload (if needed)
    // For now, we'll just simulate successful lecture creation
    
    // Simulate inserting into the database
    // In a real implementation, we would use executeQuery here
    const result = {
      insertId: Math.floor(Math.random() * 1000) + 1 // Simulate an insert ID
    };
    
    console.log(`Lecture created with ID: ${result.insertId}`);
    res.status(201).json({ 
      message: 'Lecture created successfully',
      lectureId: result.insertId
    });
  } catch (err) {
    console.error('Error creating lecture:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`===== SERVER READY =====`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Direct API endpoints available:`);
  console.log(`- GET /api/auth/profile - Gets user profile`);
  console.log(`- POST /api/auth/login - Mock login`);
  console.log(`- GET /api/courses - Gets all courses`);
  console.log(`- GET /api/lectures - Gets all lectures`);
  console.log(`=========================`);
});
