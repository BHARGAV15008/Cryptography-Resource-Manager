const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Import the courses route
const coursesRoute = require('./routes/courses');

// Register the courses route
app.use('/api/courses', coursesRoute);

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/api/courses`);
});
