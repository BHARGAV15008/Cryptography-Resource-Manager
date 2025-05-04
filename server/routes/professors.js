const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/professors/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, PNG, GIF images are allowed'));
  }
});

// Get all professors
router.get('/', async (req, res) => {
  try {
    const professors = await executeQuery(`
      SELECT p.*, u.name as creator_name 
      FROM professors p 
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.name ASC
    `);
    res.status(200).json(professors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get professor by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const professors = await executeQuery(`
      SELECT p.*, u.name as creator_name 
      FROM professors p 
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [id]);
    
    if (professors.length === 0) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    // Get professor's projects
    const projects = await executeQuery(`
      SELECT pp.*, pr.title, pr.description, pr.type, pr.thumbnail_url, pr.repo_url, pr.demo_url, pr.members, pr.supervisor
      FROM professor_projects pp
      JOIN projects pr ON pp.project_id = pr.id
      WHERE pp.professor_id = ?
      ORDER BY pp.year DESC, pr.title ASC
    `, [id]);
    
    const professorData = {
      ...professors[0],
      projects: projects
    };
    
    res.status(200).json(professorData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new professor (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, title, specialization, biography, website, email, department } = req.body;
    const userId = req.user.id;
    
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'authorised') {
      return res.status(403).json({ message: 'Access denied. Admin or authorized users only.' });
    }
    
    let imagePath = null;
    if (req.file) {
      imagePath = req.file.path;
    }
    
    const result = await executeQuery(
      'INSERT INTO professors (name, title, department, specialization, biography, website, email, profile_image, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, title, department, specialization, biography, website, email, imagePath, userId]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Professor added successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update professor (admin only)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, specialization, biography, website, email, status, department } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'authorised') {
      return res.status(403).json({ message: 'Access denied. Admin or authorized users only.' });
    }
    
    let updateQuery = 'UPDATE professors SET name = ?, title = ?, department = ?, specialization = ?, biography = ?, website = ?, email = ?';
    let queryParams = [name, title, department, specialization, biography, website, email];
    
    if (status) {
      updateQuery += ', status = ?';
      queryParams.push(status);
    }
    
    if (req.file) {
      updateQuery += ', profile_image = ?';
      queryParams.push(req.file.path);
    }
    
    updateQuery += ' WHERE id = ?';
    queryParams.push(id);
    
    await executeQuery(updateQuery, queryParams);
    
    res.status(200).json({ message: 'Professor updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete professor (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    await executeQuery('DELETE FROM professors WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Professor deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add project to professor (admin only)
router.post('/:professorId/projects', auth, async (req, res) => {
  try {
    const { professorId } = req.params;
    const { projectId, status, year } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'authorised') {
      return res.status(403).json({ message: 'Access denied. Admin or authorized users only.' });
    }
    
    const result = await executeQuery(
      'INSERT INTO professor_projects (professor_id, project_id, status, year) VALUES (?, ?, ?, ?)',
      [professorId, projectId, status, year]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Project added to professor successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update professor project status (admin only)
router.put('/:professorId/projects/:projectId', auth, async (req, res) => {
  try {
    const { professorId, projectId } = req.params;
    const { status, year } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'authorised') {
      return res.status(403).json({ message: 'Access denied. Admin or authorized users only.' });
    }
    
    await executeQuery(
      'UPDATE professor_projects SET status = ?, year = ? WHERE professor_id = ? AND project_id = ?',
      [status, year, professorId, projectId]
    );
    
    res.status(200).json({ message: 'Professor project updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove project from professor (admin only)
router.delete('/:professorId/projects/:projectId', auth, async (req, res) => {
  try {
    const { professorId, projectId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    await executeQuery(
      'DELETE FROM professor_projects WHERE professor_id = ? AND project_id = ?',
      [professorId, projectId]
    );
    
    res.status(200).json({ message: 'Project removed from professor successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;