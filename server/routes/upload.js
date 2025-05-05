const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the destination folder based on the upload type
    let uploadDir = 'uploads';
    
    if (req.query.type === 'event') {
      uploadDir = 'uploads/events';
    } else if (req.query.type === 'professor') {
      uploadDir = 'uploads/professors';
    } else if (req.query.type === 'resource') {
      uploadDir = 'uploads/resources';
    }
    
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const type = req.query.type || 'general';
    cb(null, `${type}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Allow only image files
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only image files are allowed'));
  }
});

// Upload endpoint
router.post('/', upload.single('image'), (req, res) => {
  try {
    console.log('File upload request received');
    console.log('Request query:', req.query);
    console.log('File:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create a URL path that can be used by the client
    const filePath = req.file.path.replace(/\\/g, '/'); // Replace backslashes with forward slashes
    const fileUrl = `/${filePath}`; // Add leading slash for URL format
    
    console.log('File uploaded successfully:', fileUrl);
    
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

module.exports = router;
