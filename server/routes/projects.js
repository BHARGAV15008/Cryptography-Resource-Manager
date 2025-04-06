const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/projects/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|zip|rar|doc|docx|ppt|pptx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, ZIP, RAR, DOC, DOCX, PPT, PPTX files are allowed'));
  }
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const [projects] = await pool.query(`
      SELECT p.*, CONCAT(u.name, ' ', u.surname) as creator_name 
      FROM projects p 
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get projects by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const [projects] = await pool.query(`
      SELECT p.*, CONCAT(u.name, ' ', u.surname) as creator_name 
      FROM projects p 
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.type = ?
      ORDER BY p.created_at DESC
    `, [type]);
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [projects] = await pool.query(`
      SELECT p.*, CONCAT(u.name, ' ', u.surname) as creator_name 
      FROM projects p 
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [id]);
    
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(projects[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new project (admin only)
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, description, type, url } = req.body;
    const createdBy = req.user.id;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    let filePath = null;
    if (req.file) {
      filePath = req.file.path;
    }
    
    const [result] = await pool.query(
      'INSERT INTO projects (title, description, type, url, file_path, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, type, url, filePath, createdBy]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Project added successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project (admin only)
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, url } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    let updateQuery = 'UPDATE projects SET title = ?, description = ?, type = ?, url = ?';
    let queryParams = [title, description, type, url];
    
    if (req.file) {
      updateQuery += ', file_path = ?';
      queryParams.push(req.file.path);
    }
    
    updateQuery += ' WHERE id = ?';
    queryParams.push(id);
    
    await pool.query(updateQuery, queryParams);
    
    res.status(200).json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;