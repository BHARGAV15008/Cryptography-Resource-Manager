const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Files will be stored in uploads directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('uploads'));
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ========= MOCK DATABASE =========
// Store data in memory for testing
const mockDatabase = {
  courses: [],
  lectures: [],
  lastCourseId: 0,
  lastLectureId: 0
};

// Generate a test course
mockDatabase.courses.push({
  id: ++mockDatabase.lastCourseId,
  name: 'Cryptography 101',
  title: 'Cryptography 101',
  code: 'CRY101',
  description: 'Introduction to cryptography concepts and techniques',
  professor_id: null,
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  lectures: []
});

// Generate a test lecture
mockDatabase.lectures.push({
  id: ++mockDatabase.lastLectureId,
  title: 'Lecture 1: Introduction to Encryption',
  course_id: 1,
  lecture_date: new Date().toISOString().split('T')[0],
  description: 'Basic encryption concepts and history',
  slides_url: null,
  video_url: null,
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

// Update the course to include the lecture
mockDatabase.courses[0].lectures = [
  {
    id: 1,
    lectureNo: 1,
    topic: 'Introduction to Encryption',
    date: new Date().toISOString().split('T')[0],
    notes: {
      type: 'url',
      content: 'Basic encryption concepts and history'
    }
  }
];

// ========= API ROUTES =========

// Simple auth middleware - accepts any token
const verifyToken = (req, res, next) => {
  const token = req.header('x-auth-token');
  console.log('Token provided:', token ? 'Yes' : 'No');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

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
app.get('/api/courses', verifyToken, (req, res) => {
  try {
    console.log('Fetching all courses...');
    console.log(`Courses in mock database: ${mockDatabase.courses.length}`);
    console.log('Sending courses data to client:', JSON.stringify(mockDatabase.courses).substring(0, 200) + '...');
    res.json(mockDatabase.courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create a new course
app.post('/api/courses', verifyToken, (req, res) => {
  try {
    console.log('Adding new course...');
    console.log('Request body:', req.body);
    
    const { name, description } = req.body;
    
    // Create a new course
    const newCourse = {
      id: ++mockDatabase.lastCourseId,
      name,
      title: name,  // Map name to title for DB compatibility
      code: name.substring(0, 3).toUpperCase() + mockDatabase.lastCourseId,
      description,
      professor_id: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lectures: []
    };
    
    // Add to mock database
    mockDatabase.courses.push(newCourse);
    
    console.log(`Course created with ID: ${newCourse.id}`);
    console.log(`Now we have ${mockDatabase.courses.length} courses.`);
    
    res.status(201).json({ 
      message: 'Course created successfully',
      courseId: newCourse.id
    });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET all lectures
app.get('/api/lectures', verifyToken, (req, res) => {
  try {
    console.log('Fetching all lectures...');
    console.log(`Lectures in mock database: ${mockDatabase.lectures.length}`);
    res.json(mockDatabase.lectures);
  } catch (err) {
    console.error('Error fetching lectures:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET lectures by course ID
app.get('/api/lectures/course/:courseId', verifyToken, (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    console.log(`Fetching lectures for course ID: ${courseId}`);
    
    const lectures = mockDatabase.lectures.filter(lecture => lecture.course_id === courseId);
    console.log(`Lectures found: ${lectures.length}`);
    res.json(lectures);
  } catch (err) {
    console.error('Error fetching course lectures:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create a new lecture with file upload support
app.post('/api/lectures', verifyToken, upload.single('pdfFile'), (req, res) => {
  try {
    console.log('Adding new lecture...');
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.originalname : 'No file');
    
    const { courseId, lectureNo, topic, date, notes } = req.body;
    
    // Find the course
    const courseIndex = mockDatabase.courses.findIndex(course => course.id === parseInt(courseId));
    
    if (courseIndex === -1) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Determine file info if a file was uploaded
    let fileInfo = null;
    if (req.file) {
      fileInfo = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        path: req.file.path,
        size: req.file.size,
        url: `/api/lectures/download/${req.file.filename}`,
        type: 'pdf'
      };
      console.log('File saved successfully:', fileInfo);
    }
    
    // Create notes object with file information if uploaded
    const notesObj = fileInfo ? {
      type: 'pdf',
      content: fileInfo.originalName,
      url: fileInfo.url,
      fileInfo: fileInfo
    } : {
      type: notes.type || 'url',
      content: notes.content || ''
    };
    
    // Create a new lecture
    const newLecture = {
      id: ++mockDatabase.lastLectureId,
      title: `Lecture ${lectureNo}: ${topic}`,
      course_id: parseInt(courseId),
      lecture_date: date,
      description: notes && notes.content ? notes.content : 'No description provided',
      slides_url: fileInfo ? fileInfo.url : null,
      video_url: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      file: fileInfo
    };
    
    // Add to mock database
    mockDatabase.lectures.push(newLecture);
    
    // Also add to the course's lectures array
    mockDatabase.courses[courseIndex].lectures.push({
      id: newLecture.id,
      lectureNo: parseInt(lectureNo),
      topic,
      date,
      notes: notesObj
    });
    
    console.log(`Lecture created with ID: ${newLecture.id}`);
    console.log(`Now we have ${mockDatabase.lectures.length} lectures.`);
    
    res.status(201).json({ 
      message: 'Lecture created successfully',
      lectureId: newLecture.id,
      fileInfo: fileInfo
    });
  } catch (err) {
    console.error('Error creating lecture:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// File download route
app.get('/api/lectures/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    console.log(`Download requested for file: ${filename}`);
    console.log(`Looking for file at: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Get file mimetype from filename
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.doc' || ext === '.docx') contentType = 'application/msword';
    else if (ext === '.ppt' || ext === '.pptx') contentType = 'application/vnd.ms-powerpoint';
    else if (ext === '.xls' || ext === '.xlsx') contentType = 'application/vnd.ms-excel';
    else if (ext === '.zip') contentType = 'application/zip';
    else if (ext === '.txt') contentType = 'text/plain';
    
    console.log(`Sending file with content-type: ${contentType}`);
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    
    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ message: 'Error downloading file', error: err.message });
  }
});

// GET lecture by ID
app.get('/api/lectures/:id', verifyToken, (req, res) => {
  try {
    const lectureId = parseInt(req.params.id);
    console.log(`Fetching lecture with ID: ${lectureId}`);
    
    const lecture = mockDatabase.lectures.find(lecture => lecture.id === lectureId);
    
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }
    
    res.json(lecture);
  } catch (err) {
    console.error('Error fetching lecture:', err);
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
  console.log(`===== SIMPLIFIED API SERVER READY =====`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available:`);
  console.log(`- GET /api/auth/profile - Gets user profile`);
  console.log(`- POST /api/auth/login - Mock login`);
  console.log(`- GET /api/courses - Gets all courses`);
  console.log(`- POST /api/courses - Creates a new course`);
  console.log(`- GET /api/lectures - Gets all lectures`);
  console.log(`- POST /api/lectures - Creates a new lecture`);
  console.log(`=========================`);
});
