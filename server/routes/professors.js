const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the directory exists
    const fs = require('fs');
    const dir = 'uploads/professors';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `professor-${uniqueSuffix}${ext}`);
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
router.post('/', auth, async (req, res) => {
  try {
    const { name, title, specialization, biography, website, email, department, profile_image } = req.body;
    const userId = req.user.id;
    
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'authorised') {
      return res.status(403).json({ message: 'Access denied. Admin or authorized users only.' });
    }
    
    console.log('Creating professor with data:', { ...req.body, profile_image: profile_image ? 'Data URL (truncated)' : null });
    
    let imagePath = null;
    // Handle profile image if it's a data URL
    if (profile_image && profile_image.startsWith('data:image')) {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../public/uploads/professors');
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `professor-${timestamp}.jpg`;
        const filePath = path.join(uploadsDir, filename);
        
        // Extract the base64 data from the data URL
        const base64Data = profile_image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Write the file
        fs.writeFileSync(filePath, buffer);
        
        // Set the image URL to the relative path
        imagePath = `/uploads/professors/${filename}`;
        console.log('New image path:', imagePath);
      } catch (imageError) {
        console.error('Error saving image:', imageError);
      }
    }
    
    const result = await executeQuery(
      'INSERT INTO professors (name, title, department, specialization, biography, website, email, profile_image, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, title, department, specialization, biography, website, email, imagePath, userId]
    );
    
    // Fetch the newly created professor to return in the response
    const newProfessor = await executeQuery('SELECT * FROM professors WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Professor added successfully',
      professor: newProfessor[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update professor (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, specialization, biography, website, email, status, department, profile_image } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'authorised') {
      return res.status(403).json({ message: 'Access denied. Admin or authorized users only.' });
    }
    
    console.log('Updating professor with ID:', id);
    console.log('Request body:', { ...req.body, profile_image: profile_image ? 'Data URL (truncated)' : null });
    
    let updateQuery = 'UPDATE professors SET name = ?, title = ?, department = ?, specialization = ?, biography = ?, website = ?, email = ?';
    let queryParams = [name, title, department, specialization, biography, website, email];
    
    if (status) {
      updateQuery += ', status = ?';
      queryParams.push(status);
    }
    
    // Handle profile image if it's a data URL
    if (profile_image && profile_image.startsWith('data:image')) {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../public/uploads/professors');
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `professor-${timestamp}.jpg`;
        const filePath = path.join(uploadsDir, filename);
        
        // Extract the base64 data from the data URL
        const base64Data = profile_image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Write the file
        fs.writeFileSync(filePath, buffer);
        
        // Set the image URL to the relative path
        const imagePath = `/uploads/professors/${filename}`;
        console.log('New image path:', imagePath);
        updateQuery += ', profile_image = ?';
        queryParams.push(imagePath);
      } catch (imageError) {
        console.error('Error saving image:', imageError);
      }
    }
    
    updateQuery += ' WHERE id = ?';
    queryParams.push(id);
    
    console.log('Update query:', updateQuery);
    console.log('Query params:', queryParams.map(p => typeof p === 'string' && p.length > 100 ? 'Long string...' : p));
    
    const result = await executeQuery(updateQuery, queryParams);
    console.log('Update result:', result);
    
    // Fetch the updated professor to return in the response
    const updatedProfessor = await executeQuery('SELECT * FROM professors WHERE id = ?', [id]);
    
    res.status(200).json({
      message: 'Professor updated successfully',
      professor: updatedProfessor[0]
    });
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