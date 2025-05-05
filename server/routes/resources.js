const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/resources';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|ppt|pptx|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, PPT, PPTX, DOC, DOCX files are allowed'));
  }
});

// No more separate routes for resource types - all filtering is done on the main route with query parameters

// Get all resources with optional type filtering through query parameters
router.get('/', async (req, res) => {
  try {
    // Check if type filter is provided in query parameters
    const { type } = req.query;
    
    let query = `
      SELECT r.*, u.name as creator_name 
      FROM resources r 
      LEFT JOIN users u ON r.created_by = u.id
    `;
    
    // Add WHERE clause if type filter is provided
    if (type && type !== 'all') {
      query += ` WHERE r.type = '${type}'`;
    }
    
    // Add ORDER BY clause
    query += ` ORDER BY r.created_at DESC`;
    
    console.log(`Fetching resources with type filter: ${type || 'none'}`);
    const resources = await db.executeQuery(query);
    
    res.status(200).json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get resources by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const resources = await db.executeQuery(`
      SELECT r.*, u.name as creator_name 
      FROM resources r 
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.type = ?
    `, [type]);
    res.status(200).json(resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new resource (admin only)
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('Resource creation request received');
    console.log('User data:', req.user);
    
    const { title, description, type, url } = req.body;
    const userId = req.user ? req.user.id : 1;
    
    // Check if user is admin - temporarily disabled for testing
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Access denied. Admin only.' });
    // }
    
    let filePath = null;
    if (req.file) {
      filePath = req.file.path;
    }
    
    // Format date in MySQL compatible format (YYYY-MM-DD HH:MM:SS)
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('Using formatted date for MySQL:', formattedDate);
    
    const result = await db.executeQuery(
      'INSERT INTO resources (title, description, type, url, file_path, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, type, url, filePath, userId, formattedDate]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      title,
      description,
      type,
      url,
      file_path: filePath,
      created_by: userId,
      created_at: formattedDate,
      createdAt: formattedDate,
      message: 'Resource added successfully' 
    });
  } catch (error) {
    console.error('Resource creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update resource (admin only)
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, url, author, tags } = req.body;
    
    // Check if user is admin - temporarily disabled for testing
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Access denied. Admin only.' });
    // }
    console.log('Update request received for resource ID:', id);
    console.log('Update data:', { title, description, type, url, author, tags });
    
    // First, check if the resource exists
    const existingResource = await db.executeQuery(
      'SELECT * FROM resources WHERE id = ?',
      [id]
    );
    
    if (existingResource.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Format date in MySQL compatible format (YYYY-MM-DD HH:MM:SS)
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
    
    // Start building the update query - include author field
    let updateQuery = 'UPDATE resources SET title = ?, description = ?, type = ?, url = ?, updated_at = ?';
    let queryParams = [title, description, type, url, formattedDate];
    
    // Add author if provided
    if (author) {
      updateQuery += ', author = ?';
      queryParams.push(author);
    }
    
    // Handle file if uploaded
    if (req.file) {
      updateQuery += ', file_path = ?';
      queryParams.push(req.file.path);
    }
    
    // Finalize the query
    updateQuery += ' WHERE id = ?';
    queryParams.push(id);
    
    console.log('Update query:', updateQuery);
    console.log('Query parameters:', queryParams);
    
    const updateResult = await db.executeQuery(updateQuery, queryParams);
    console.log('Update query result:', updateResult);
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Resource not found or no changes made' });
    }
    
    // Handle tags if provided (requires separate handling as they're stored in a different way)
    if (tags && Array.isArray(tags) && tags.length > 0) {
      try {
        // First, delete existing tags for this resource
        await db.executeQuery('DELETE FROM resource_tags WHERE resource_id = ?', [id]);
        
        // Then insert new tags
        for (const tag of tags) {
          await db.executeQuery(
            'INSERT INTO resource_tags (resource_id, tag) VALUES (?, ?)',
            [id, tag]
          );
        }
        
        console.log(`Updated ${tags.length} tags for resource ${id}`);
      } catch (tagError) {
        console.error('Error updating tags:', tagError);
        // Continue with the response even if tag update fails
      }
    }
    
    // Fetch the updated resource to return it
    const updatedResource = await db.executeQuery(
      'SELECT r.*, u.name as creator_name FROM resources r LEFT JOIN users u ON r.created_by = u.id WHERE r.id = ?',
      [id]
    );
    
    console.log('Updated resource query result:', updatedResource);
    
    if (updatedResource.length === 0) {
      return res.status(404).json({ message: 'Resource not found after update' });
    }
    
    // Fetch tags for this resource
    const resourceTags = await db.executeQuery(
      'SELECT tag FROM resource_tags WHERE resource_id = ?',
      [id]
    );
    
    // Extract tags into an array
    const tagsArray = resourceTags.map(row => row.tag);
    
    // Add tags to the resource object
    const resourceWithTags = {
      ...updatedResource[0],
      tags: tagsArray
    };
    
    // Return the updated resource with success message
    res.status(200).json({
      message: 'Resource updated successfully',
      resource: resourceWithTags
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete resource (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin - temporarily disabled for testing
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Access denied. Admin only.' });
    // }
    console.log('Delete request received for resource ID:', id);
    
    await db.executeQuery('DELETE FROM resources WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload file endpoint
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Get file path
    const filePath = req.file.path;
    
    // In a production environment, this would be a URL to a CDN or file server
    // For development, we'll just use the local path
    const fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
    
    res.status(200).json({ 
      message: 'File uploaded successfully',
      url: fileUrl,
      file_path: filePath
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// Mock file upload endpoint for development/testing
router.post('/upload/mock', (req, res) => {
  try {
    console.log('Mock file upload endpoint called');
    
    // Return mock file URL
    res.status(200).json({ 
      message: 'File uploaded successfully (mock)',
      url: 'https://example.com/mock-file.pdf',
      file_path: '/uploads/resources/mock-file.pdf'
    });
  } catch (error) {
    console.error('Mock file upload error:', error);
    res.status(500).json({ message: 'Server error during mock file upload' });
  }
});

// Mock endpoint that always returns data (for development/testing)
router.get('/mock', (req, res) => {
  try {
    console.log('Serving mock resource data (guaranteed to work without DB connection)');
    
    const mockResources = [
      {
        id: 1,
        title: 'Introduction to Symmetric Cryptography',
        description: 'A comprehensive overview of symmetric encryption techniques',
        type: 'video',
        url: 'https://example.com/video1',
        file_path: null,
        created_by: 1,
        creator_name: 'Dr. Jane Smith',
        tags: ['symmetric', 'encryption', 'basics'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Public Key Infrastructure Explained',
        description: 'Deep dive into PKI and its applications in modern cryptography',
        type: 'pdf',
        url: 'https://example.com/pki-guide.pdf',
        file_path: '/uploads/resources/pki-guide.pdf',
        created_by: 2,
        creator_name: 'Prof. John Doe',
        tags: ['PKI', 'asymmetric', 'advanced'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Blockchain and Cryptography',
        description: 'How cryptographic principles are used in blockchain technology',
        type: 'book',
        url: 'https://example.com/blockchain-book',
        file_path: null,
        created_by: 1,
        creator_name: 'Michael Chen',
        tags: ['blockchain', 'applications', 'modern'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ];
    
    res.status(200).json(mockResources);
  } catch (error) {
    console.error('Error in mock endpoint:', error);
    // Even if there's an error, still return mock data
    res.status(200).json([
      {
        id: 1,
        title: 'Emergency Fallback Resource',
        description: 'This is a fallback resource when all else fails',
        type: 'document',
        url: 'https://example.com/fallback',
        created_by: 1,
        creator_name: 'System',
        tags: ['fallback'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]);
  }
});

module.exports = router;