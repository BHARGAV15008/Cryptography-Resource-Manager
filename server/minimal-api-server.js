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
  events: [],
  resources: [],
  lastCourseId: 0,
  lastLectureId: 0,
  lastEventId: 0,
  lastResourceId: 0
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

// Events endpoints
// GET all events
app.get('/api/events', verifyToken, (req, res) => {
  try {
    console.log('Fetching all events...');
    res.json(mockDatabase.events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create a new event
app.post('/api/events', verifyToken, upload.single('eventImage'), (req, res) => {
  try {
    console.log('Adding new event...');
    console.log('Request body:', req.body);
    
    const { title, description, startDate, endDate, location, organizerName, eventType } = req.body;
    
    // Create event object
    const newEvent = {
      id: ++mockDatabase.lastEventId,
      title: title || 'Untitled Event',
      description: description || '',
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date().toISOString(),
      location: location || 'TBD',
      organizerName: organizerName || 'Anonymous',
      eventType: eventType || 'workshop',
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      created_by: req.user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to mock database
    mockDatabase.events.push(newEvent);
    
    console.log(`Event created with ID: ${newEvent.id}`);
    console.log(`Now we have ${mockDatabase.events.length} events.`);
    
    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET event by ID
app.get('/api/events/:id', verifyToken, (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    console.log(`Fetching event with ID: ${eventId}`);
    
    const event = mockDatabase.events.find(event => event.id === eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE event
app.delete('/api/events/:id', verifyToken, (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    console.log(`Deleting event with ID: ${eventId}`);
    
    const eventIndex = mockDatabase.events.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    mockDatabase.events.splice(eventIndex, 1);
    
    console.log(`Event with ID ${eventId} has been deleted`);
    console.log(`Now we have ${mockDatabase.events.length} events.`);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add some mock events for testing
const addMockEvents = () => {
  if (mockDatabase.events.length === 0) {
    mockDatabase.events.push({
      id: ++mockDatabase.lastEventId,
      title: 'Cryptography Workshop 2025',
      description: 'A hands-on workshop covering the latest cryptographic algorithms and techniques.',
      startDate: '2025-06-15T09:00:00Z',
      endDate: '2025-06-15T17:00:00Z',
      location: 'Virtual Event',
      organizerName: 'Cryptography Research Group',
      eventType: 'workshop',
      imageUrl: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    mockDatabase.events.push({
      id: ++mockDatabase.lastEventId,
      title: 'International Cryptography Conference',
      description: 'Annual conference bringing together researchers and practitioners in cryptography.',
      startDate: '2025-07-20T09:00:00Z',
      endDate: '2025-07-23T17:00:00Z',
      location: 'Berlin, Germany',
      organizerName: 'International Association for Cryptographic Research',
      eventType: 'conference',
      imageUrl: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log(`Added ${mockDatabase.events.length} mock events.`);
  }
};

// Initialize mock events
addMockEvents();

// Resources endpoints
// Add some mock resources
const addMockResources = () => {
  if (mockDatabase.resources.length === 0) {
    mockDatabase.resources.push({
      id: ++mockDatabase.lastResourceId,
      title: 'Introduction to Symmetric Cryptography',
      description: 'A comprehensive overview of symmetric encryption techniques',
      type: 'article',
      url: 'https://example.com/symmetric-crypto',
      file_path: null,
      content: 'Symmetric cryptography is a foundational concept in data security...',
      created_by: 1,
      creator_name: 'Dr. Jane Smith',
      tags: ['symmetric', 'encryption', 'basics'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    mockDatabase.resources.push({
      id: ++mockDatabase.lastResourceId,
      title: 'Public Key Infrastructure Explained',
      description: 'A deep dive into PKI and its applications in modern security',
      type: 'pdf',
      url: null,
      file_path: '/uploads/sample-pki-document.pdf',
      content: null,
      created_by: 1,
      creator_name: 'Prof. Robert Johnson',
      tags: ['asymmetric', 'pki', 'certificates'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    mockDatabase.resources.push({
      id: ++mockDatabase.lastResourceId,
      title: 'Blockchain and Cryptography',
      description: 'How cryptographic principles are used in blockchain technology',
      type: 'video',
      url: 'https://example.com/blockchain-video',
      file_path: null,
      content: null,
      created_by: 1,
      creator_name: 'Michael Chen',
      tags: ['blockchain', 'applications', 'modern'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log(`Added ${mockDatabase.resources.length} mock resources.`);
  }
};

// Initialize mock resources
addMockResources();

// IACR News endpoints
// Add some mock IACR news data
const addMockIACRNews = () => {
  if (!mockDatabase.iacrNews) {
    mockDatabase.iacrNews = [
      {
        id: 1,
        title: 'Call for Papers: CRYPTO 2025',
        link: 'https://iacr.org/crypto2025',
        category: 'crypto',
        date: new Date('2024-12-15').toISOString(),
        description: 'The 45th Annual International Cryptology Conference will be held in August 2025 in Santa Barbara, California.'
      },
      {
        id: 2,
        title: 'IACR Fellows 2024 Announced',
        link: 'https://iacr.org/fellows/2024',
        category: 'announcement',
        date: new Date('2024-11-01').toISOString(),
        description: 'The International Association for Cryptologic Research is pleased to announce the IACR Fellows for 2024.'
      },
      {
        id: 3,
        title: 'Best Paper Award at ASIACRYPT 2024',
        link: 'https://iacr.org/asiacrypt2024/awards',
        category: 'asiacrypt',
        date: new Date('2024-10-25').toISOString(),
        description: 'The best paper award at ASIACRYPT 2024 goes to "Advanced Techniques in Post-Quantum Cryptography".'
      },
      {
        id: 4,
        title: 'New Side-Channel Attack on AES',
        link: 'https://eprint.iacr.org/2024/123',
        category: 'ePrint_report',
        date: new Date('2024-09-20').toISOString(),
        description: 'Researchers demonstrate a new side-channel attack on hardware implementations of AES.'
      },
      {
        id: 5,
        title: 'PhD Position in Cryptography at ETH Zurich',
        link: 'https://iacr.org/jobs/1234',
        category: 'job_posting',
        date: new Date('2024-08-15').toISOString(),
        description: 'The Applied Cryptography Group at ETH Zurich is looking for a PhD student to work on post-quantum cryptography.'
      },
      {
        id: 6,
        title: 'Workshop on Quantum-Safe Cryptography',
        link: 'https://quantum-safe-crypto.org/2024',
        category: 'event_calender',
        date: new Date('2024-07-10').toISOString(),
        description: 'A three-day workshop on quantum-safe cryptography will be held in London in November 2024.'
      },
      {
        id: 7,
        title: 'IACR Elections 2024: Call for Nominations',
        link: 'https://iacr.org/elections/2024',
        category: 'election',
        date: new Date('2024-06-05').toISOString(),
        description: 'Nominations are open for the positions of President, Vice President, and Directors of the IACR.'
      },
      {
        id: 8,
        title: 'IACR Distinguished Lecture Series Announced',
        link: 'https://iacr.org/lectures/2024',
        category: 'announcement',
        date: new Date('2024-05-20').toISOString(),
        description: 'The IACR is pleased to announce the speakers for the 2024 Distinguished Lecture Series.'
      }
    ];
    console.log(`Added ${mockDatabase.iacrNews.length} mock IACR news items.`);
  }
};

// Initialize mock IACR news
addMockIACRNews();

// GET all resources
app.get('/api/resources', verifyToken, (req, res) => {
  try {
    console.log('Fetching all resources...');
    res.json(mockDatabase.resources);
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET resource by ID
app.get('/api/resources/:id', verifyToken, (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    console.log(`Fetching resource with ID: ${resourceId}`);
    
    const resource = mockDatabase.resources.find(resource => resource.id === resourceId);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    res.json(resource);
  } catch (err) {
    console.error('Error fetching resource:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create a new resource
app.post('/api/resources', verifyToken, upload.single('resourceFile'), (req, res) => {
  try {
    console.log('Adding new resource...');
    console.log('Request body:', req.body);
    
    const { title, description, type, url, tags } = req.body;
    
    // Parse tags if they come as a string
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
    
    // Create resource object
    const newResource = {
      id: ++mockDatabase.lastResourceId,
      title: title || 'Untitled Resource',
      description: description || '',
      type: type || 'article',
      url: url || null,
      file_path: req.file ? `/uploads/${req.file.filename}` : null,
      content: req.body.content || null,
      created_by: req.user?.id || 1,
      creator_name: `${req.user?.firstName || 'Anonymous'} ${req.user?.lastName || 'User'}`,
      tags: parsedTags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to mock database
    mockDatabase.resources.push(newResource);
    
    console.log(`Resource created with ID: ${newResource.id}`);
    
    res.status(201).json({
      message: 'Resource created successfully',
      resource: newResource
    });
  } catch (err) {
    console.error('Error creating resource:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// IACR News endpoint
app.get('/api/iacr-news', verifyToken, (req, res) => {
  try {
    console.log('Fetching IACR news items...');
    res.json(mockDatabase.iacrNews);
  } catch (err) {
    console.error('Error fetching IACR news:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Articles endpoint
app.get('/api/articles', verifyToken, (req, res) => {
  try {
    console.log('Fetching articles...');
    // Mock articles if we don't have any in the database
    if (!mockDatabase.articles) {
      mockDatabase.articles = [
        {
          id: 1,
          title: 'Understanding Advanced Encryption Standard',
          content: 'AES is a symmetric encryption algorithm widely used today...',
          author: 'Dr. Emma Johnson',
          date: new Date('2024-04-15').toISOString(),
          tags: ['encryption', 'symmetric', 'AES']
        },
        {
          id: 2,
          title: 'Future of Quantum Cryptography',
          content: 'Quantum cryptography leverages the principles of quantum mechanics...',
          author: 'Prof. David Chen',
          date: new Date('2024-03-22').toISOString(),
          tags: ['quantum', 'future', 'security']
        },
        {
          id: 3,
          title: 'Blockchain Technology Applications in Cryptography',
          content: 'Blockchain offers significant advantages for secure communications...',
          author: 'Sarah Williams, PhD',
          date: new Date('2024-02-10').toISOString(),
          tags: ['blockchain', 'applications', 'distributed']
        }
      ];
    }
    res.json(mockDatabase.articles);
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Notes related endpoints for ResourceDetail.js
app.get('/api/resources/notes', verifyToken, (req, res) => {
  try {
    console.log('Fetching resource notes...');
    // This endpoint is referenced in ResourceDetail.js
    // Provide mock notes data
    const notes = [
      {
        id: 1,
        title: 'Cryptographic Key Management',
        content: 'Notes on various key management techniques and best practices.',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Symmetric vs Asymmetric Encryption',
        content: 'Comparison of symmetric and asymmetric encryption methods with use cases.',
        created_at: new Date().toISOString()
      }
    ];
    
    res.json(notes);
  } catch (err) {
    console.error('Error fetching resource notes:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Bookmarks endpoint (used by ResourceDetail.js)
app.get('/api/bookmarks', verifyToken, (req, res) => {
  try {
    console.log('Fetching user bookmarks...');
    // Mock bookmarks data
    const bookmarks = [
      {
        id: 1,
        userId: 1,
        resourceId: '1',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        userId: 1,
        resourceId: '3',
        created_at: new Date().toISOString()
      }
    ];
    
    res.json(bookmarks);
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
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
