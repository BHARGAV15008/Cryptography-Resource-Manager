const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const { connectDB } = require('./config/db');
const initializeDatabase = require('./config/initDb');
const { attachPermissions } = require('./middleware/permissions');
const checkDbConnection = require('./config/checkDbConnection');

const app = express();

// Trust proxy - fix for express-rate-limit
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// Static file middleware for serving uploads
app.use(express.static('uploads'));
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5001', process.env.CLIENT_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Origin', 'Accept']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach user permissions to all authorized requests
app.use((req, res, next) => {
  // Only run permissions middleware when the request has user data
  if (req.user) {
    return attachPermissions(req, res, next);
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Root route
app.get('/', (req, res) => {
  res.send('Cryptography Resource Manager API');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Initialize database connection and tables
(async () => {
  try {
    console.log('Starting server initialization...');
    
    // Check database connection first
    const dbConnected = await checkDbConnection();
    if (!dbConnected) {
      console.error('Database connection check failed. Proceeding with caution...');
    }
    
    // Initialize database only if connection check passed
    if (dbConnected) {
      await connectDB();
      await initializeDatabase();
      console.log('Database setup complete');
    } else {
      console.warn('⚠️ Database initialization skipped due to connection issues.');
      console.warn('⚠️ API endpoints that require database access will not work.');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    // Don't exit process in development to allow for retries
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
})();

// Import executeQuery function
const { executeQuery } = require('./config/db');

// Simple auth middleware for direct routes
function directVerifyToken(req, res, next) {
  const token = req.header('x-auth-token');
  
  if (!token) {
    // For development, allow requests without token
    console.log('No token provided, continuing without authentication');
    next();
    return;
  }
  
  try {
    // In a real app, we would verify the token here
    // For development, we'll just mock a user
    req.user = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    };
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Define Routes
try {
  // Standard routes
  app.use('/api/auth', require('./routes/auth'));
  console.log('Registered /api/auth route');
  app.use('/api/users', require('./routes/users'));
  console.log('Registered /api/users route');
  app.use('/api/articles', require('./routes/articles'));
  console.log('Registered /api/articles route');
  app.use('/api/news', require('./routes/hackerNewsArticles'));
  console.log('Registered /api/news route');
  app.use('/api/iacr-news', require('./routes/iacrNews'));
  console.log('Registered /api/iacr-news route');
  app.use('/api/resources', require('./routes/resources'));
  console.log('Registered /api/resources route');
  app.use('/api/events', require('./routes/events'));
  console.log('Registered /api/events route');
  app.use('/api/projects', require('./routes/projects'));
  console.log('Registered /api/projects route');
  app.use('/api/professors', require('./routes/professors'));
  console.log('Registered /api/professors route');
  
  // Direct auth routes
  app.get('/api/auth/profile', directVerifyToken, (req, res) => {
    console.log('Profile endpoint accessed');
    res.json({
      user: req.user,
      message: 'Profile data retrieved'
    });
  });
  
  // Try to use courses route from file, fall back to direct implementation
  try {
    app.use('/api/courses', require('./routes/courses'));
    console.log('Registered /api/courses route from file');
  } catch (error) {
    console.log('Using direct implementation for /api/courses');
    
    // Direct implementation of courses route
    app.get('/api/courses', directVerifyToken, async (req, res) => {
      try {
        console.log('Fetching courses via direct implementation...');
        
        // First, log the courses table schema to help debugging
        try {
          const tableInfo = await executeQuery(`DESCRIBE courses`);
          console.log('Courses table schema:', tableInfo.map(col => col.Field).join(', '));
        } catch (schemaError) {
          console.error('Error fetching courses schema:', schemaError);
        }
        
        const courses = await executeQuery(`
          SELECT c.*, p.name as professor_name 
          FROM courses c
          LEFT JOIN professors p ON c.professor_id = p.id
          ORDER BY c.created_at DESC
        `);
        
        // Transform the data to match the expected format
        const transformedCourses = courses.map(course => ({
          id: course.id,
          name: course.title,
          description: course.description,
          code: course.code,
          semester: course.semester,
          year: course.year,
          professor_name: course.professor_name,
          professor_id: course.professor_id,
          created_at: course.created_at,
          // Add empty lectures array for each course
          lectures: []
        }));
        
        // Now fetch lectures for each course if there are courses
        if (transformedCourses.length > 0) {
          try {
            const lectures = await executeQuery(`
              SELECT * FROM lectures
              ORDER BY lecture_date DESC
            `);
            
            // Group lectures by course
            lectures.forEach(lecture => {
              const course = transformedCourses.find(c => c.id === lecture.course_id);
              if (course) {
                course.lectures.push({
                  id: lecture.id,
                  title: lecture.title,
                  date: lecture.lecture_date,
                  description: lecture.description,
                  slides_url: lecture.slides_url,
                  video_url: lecture.video_url
                });
              }
            });
          } catch (lectureError) {
            console.error('Error fetching lectures:', lectureError);
          }
        }
        
        console.log(`Courses fetched: ${courses.length}, Transformed: ${transformedCourses.length}`);
        console.log('Sending courses data to client:', JSON.stringify(transformedCourses).substring(0, 200) + '...');
        res.json(transformedCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // DELETE a course by ID - SIMPLIFIED VERSION
    app.delete('/api/courses/:id', directVerifyToken, async (req, res) => {
      try {
        const courseId = req.params.id;
        console.log(`DIRECT DATABASE DELETION ATTEMPT for course ID: ${courseId}`);
        
        // Simple direct deletion without any complex logic
        const result = await executeQuery('DELETE FROM courses WHERE id = ?', [courseId]);
        
        console.log('Delete result:', result);
        console.log('Affected rows:', result.affectedRows);
        
        if (result.affectedRows > 0) {
          console.log(`SUCCESSFULLY DELETED course with ID: ${courseId}`);
          res.status(200).json({ message: 'Course deleted successfully' });
        } else {
          console.log(`NO COURSE FOUND with ID: ${courseId}`);
          res.status(404).json({ message: 'Course not found' });
        }
      } catch (err) {
        console.error('DATABASE ERROR DELETING COURSE:', err);
        console.error('SQL Error Code:', err.code);
        console.error('SQL Error Message:', err.message);
        
        res.status(500).json({ 
          message: 'Failed to delete course from database',
          error: err.message,
          sqlError: err.code
        });
      }
    });
    
    // POST create a new course
    app.post('/api/courses', directVerifyToken, async (req, res) => {
      try {
        console.log('Adding new course via direct implementation...');
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);
        console.log('Content-Type:', req.headers['content-type']);
        
        // Log all form fields for debugging
        if (req.body instanceof Object) {
          console.log('Form fields:', Object.keys(req.body));
          for (const key in req.body) {
            console.log(`Field ${key}:`, req.body[key]);
          }
        }
        
        // Map client-side field names to server-side field names
        const { name, title: clientTitle, description, code, semester, year, professor_id, syllabus_url } = req.body;
        
        // Use either name or title from the client, prioritizing name if available
        const title = name || clientTitle || 'Untitled Course';
        console.log('Using title:', title);
        
        // CRITICAL: Force console log to ensure we're actually trying to save
        console.log('ATTEMPTING TO SAVE COURSE TO DATABASE WITH TITLE:', title);
        
        const createdBy = req.user ? req.user.id : null;
        
        // SIMPLIFIED: Direct database insertion with minimal complexity
        try {
          // Use provided code or generate one if not provided
          const courseCode = code || title.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);
          
          console.log('DIRECT DATABASE INSERTION ATTEMPT');
          console.log('Title:', title);
          console.log('Code:', courseCode);
          console.log('Description:', description);
          
          // Simple direct SQL insertion
          const sql = `
            INSERT INTO courses (title, code, description, semester, year, professor_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NULL, NOW(), NOW())
          `;
          
          const queryParams = [title, courseCode, description, semester || null, year || null];
          console.log('Executing SQL:', sql);
          console.log('With parameters:', queryParams);
          
          // Execute the query directly
          const result = await executeQuery(sql, queryParams);
          
          console.log(`Course created with ID: ${result.insertId}`);
          res.status(201).json({ 
            message: 'Course created successfully',
            courseId: result.insertId
          });
        } catch (dbError) {
          console.error('DATABASE ERROR CREATING COURSE:', dbError);
          console.error('SQL Error Code:', dbError.code);
          console.error('SQL Error Message:', dbError.message);
          console.error('SQL Error State:', dbError.sqlState);
          
          // Return the actual error to the client
          res.status(500).json({ 
            message: 'Failed to create course in database',
            error: dbError.message,
            sqlError: dbError.code
          });
        }
      } catch (err) {
        console.error('Error creating course:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
  }
  
  // Try to use lectures route from file, fall back to direct implementation
  try {
    app.use('/api/lectures', require('./routes/lectures'));
    console.log('Registered /api/lectures route from file');
  } catch (error) {
    console.log('Using direct implementation for /api/lectures');
    
    // Direct implementation of lectures route
    app.get('/api/lectures', directVerifyToken, async (req, res) => {
      try {
        console.log('Fetching lectures via direct implementation...');
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
    
    // POST create a new lecture
    app.post('/api/lectures', directVerifyToken, async (req, res) => {
      try {
        console.log('Adding new lecture via direct implementation...');
        console.log('Request body:', req.body);
        
        // Extract all possible fields from the request body
        const { 
          title, 
          topic, 
          course_id, 
          courseId, 
          lecture_no, 
          lectureNo,
          lecture_date, 
          date, 
          description, 
          notes,
          slides_url
        } = req.body;
        
        // Log all fields for debugging
        console.log('All extracted fields:', {
          title, topic, course_id, courseId, lecture_no, lectureNo, lecture_date, date, description, notes, slides_url
        });
        
        // Use the appropriate fields (client-side or server-side naming)
        const finalTitle = title || topic || 'Untitled Lecture';
        const finalCourseId = course_id || courseId;
        const finalLectureNo = lecture_no || lectureNo || '1';
        const finalDate = lecture_date || date || new Date().toISOString().split('T')[0];
        const finalDescription = description || (notes && notes.content) || 'No description';
        const finalSlidesUrl = slides_url || '';
        
        console.log('Final fields for database:', {
          title: finalTitle,
          course_id: finalCourseId,
          lecture_no: finalLectureNo,
          lecture_date: finalDate,
          description: finalDescription,
          slides_url: finalSlidesUrl
        });
        
        // Build the SQL query with all required fields - remove lecture_no which doesn't exist in the schema
        const sql = `
          INSERT INTO lectures (title, course_id, lecture_date, description, slides_url, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        // Remove finalLectureNo from parameters since we removed it from the SQL query
        const queryParams = [finalTitle, finalCourseId, finalDate, finalDescription, finalSlidesUrl];
        console.log('SQL query:', sql);
        console.log('Query parameters:', queryParams);
        
        const result = await executeQuery(sql, queryParams);
        
        console.log(`Lecture created with ID: ${result.insertId}`);
        res.status(201).json({ 
          message: 'Lecture created successfully',
          lectureId: result.insertId
        });
      } catch (err) {
        console.error('Error creating lecture:', err);
        res.status(500).json({ 
          message: 'Failed to create lecture', 
          error: err.message 
        });
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
  }
} catch (error) {
  console.error('Error registering routes:', error);
}

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ message: 'API endpoint not found' });
});

// Initialize server
const PORT = process.env.PORT || 5001;

// Start server with better error handling
async function startServer() {
  try {
    console.log('Starting server...');
    // Check if the database is accessible, but continue even if there's an error
    try {
      await checkDbConnection()
        .then((status) => console.log(status))
        .catch((error) => console.warn(`Database warning (non-fatal): ${error.message}`));
    } catch (dbError) {
      console.warn(`Database setup warning (continuing anyway): ${dbError.message}`);
    }

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
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    // Graceful shutdown
    process.exit(1);
  }
}

startServer();