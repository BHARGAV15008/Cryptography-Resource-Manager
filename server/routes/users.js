const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/permissions');

/* 
 * Looking at the error message and the userController exports, 
 * we need to comment out or implement routes that use undefined controller functions
 */

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', userController.getUsers);

// @route   GET /api/users/all
// @desc    Get all users without authentication (for development)
// @access  Public (for development only)
router.get('/all', async (req, res) => {
  try {
    console.log('Fetching all users from database');
    // Use the controller function but handle errors here
    await userController.getUsers(req, res);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users', 
      error: error.message 
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public (for development)
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Fetching user with ID:', userId);
    
    const { executeQuery } = require('../config/db');
    
    // Get user
    const users = await executeQuery(
      `SELECT u.id, u.first_name, u.last_name, u.name, u.email, u.role, u.email_verified, u.created_at,
       up.access_dashboard, up.manage_users, up.manage_contents, up.can_view_analytics
       FROM users u
       LEFT JOIN user_permissions up ON u.id = up.user_id
       WHERE u.id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Format user data
    const formattedUser = {
      id: user.id,
      name: user.name,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      emailVerified: Boolean(user.email_verified),
      createdAt: user.created_at,
      permissions: {
        canAccessDashboard: Boolean(user.access_dashboard),
        canManageUsers: Boolean(user.manage_users),
        canManageContent: Boolean(user.manage_contents),
        canViewAnalytics: Boolean(user.can_view_analytics)
      }
    };
    
    return res.json(formattedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users
// @desc    Create a new user
// @access  Public
router.post('/', async (req, res) => {
  try {
    console.log('Creating new user:', req.body);
    const { name, surname, email, password, role } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const { executeQuery, beginTransaction, commitTransaction, rollbackTransaction } = require('../config/db');
    const bcrypt = require('bcryptjs');
    
    // Check if user already exists
    const existingUsers = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Begin transaction
    let connection;
    try {
      connection = await beginTransaction();
      
      // Create user
      const newUserResult = await executeQuery(
        `INSERT INTO users (first_name, last_name, email, password, role, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [name, surname || '', email, hashedPassword, role || 'regular']
      );
      
      const userId = newUserResult.insertId;
      
      // Create user settings
      await executeQuery(
        `INSERT INTO user_settings (user_id, created_at) 
         VALUES (?, NOW())`,
        [userId]
      );
      
      // Create user permissions
      await executeQuery(
        `INSERT INTO user_permissions (user_id, access_dashboard, manage_users, manage_contents, can_view_analytics, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId, true, role === 'admin', role === 'admin' || role === 'authorized', true]
      );
      
      // Commit transaction
      await commitTransaction(connection);
      
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        userId,
        email
      });
    } catch (error) {
      // Rollback on error
      if (connection) {
        await rollbackTransaction(connection);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/verify-otp
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-otp', userController.verifyOTPAndActivateAccount);

// @route   POST /api/users/resend-otp
// @desc    Resend OTP for email verification
// @access  Public
router.post('/resend-otp', userController.resendOTP);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', userController.loginUser);

// @route   PUT /api/users/password
// @desc    Update user password
// @access  Private
router.put('/password', auth, authController.updatePassword);

// @route   GET /api/users/me
// @desc    Get user profile
// @access  Private
router.get('/me', auth, userController.getUserProfile);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Public (for development)
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, surname, email, role, password } = req.body;
    console.log('Updating user:', userId, req.body);
    
    const { executeQuery } = require('../config/db');
    const bcrypt = require('bcryptjs');
    
    // Check if user exists
    const userExists = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Build update query
    let updateFields = [];
    let queryParams = [];
    
    if (name) {
      updateFields.push('first_name = ?');
      queryParams.push(name);
    }
    
    if (surname) {
      updateFields.push('last_name = ?');
      queryParams.push(surname);
    }
    
    if (email) {
      // Check if email is already taken by another user
      const emailExists = await executeQuery('SELECT * FROM users WHERE email = ? AND id != ?', [email, userId]);
      
      if (emailExists.length > 0) {
        return res.status(400).json({ message: 'Email already in use by another user' });
      }
      
      updateFields.push('email = ?');
      queryParams.push(email);
    }
    
    if (role) {
      updateFields.push('role = ?');
      queryParams.push(role);
    }
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.push('password = ?');
      queryParams.push(hashedPassword);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Add user ID to params
    queryParams.push(userId);
    
    // Update user
    await executeQuery(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );
    
    // If role was updated, update permissions
    if (role) {
      await executeQuery(
        `UPDATE user_permissions SET 
         manage_users = ?, 
         manage_contents = ? 
         WHERE user_id = ?`,
        [role === 'admin', role === 'admin' || role === 'authorized', userId]
      );
    }
    
    return res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Public (for development)
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting user with ID:', req.params.id);
    // Set admin user for development
    req.user = { id: 1, role: 'admin' };
    
    // Get user by ID first to check if it exists
    const userId = req.params.id;
    const { executeQuery } = require('../config/db');
    
    const userExists = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user from database
    await executeQuery('DELETE FROM users WHERE id = ?', [userId]);
    
    return res.status(200).json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/:id/audit-logs
// @desc    Get user audit logs
// @access  Private/Admin
router.get('/:id/audit-logs', auth, userController.getUserAuditLogs);

// @route   PUT /api/users/profile/me
// @desc    Update current user profile
// @access  Private
router.put('/profile/me', auth, userController.updateCurrentUserProfile);

// @route   PUT /api/users/:id/permissions
// @desc    Update user permissions
// @access  Private/Admin
router.put('/:id/permissions', auth, userController.updateUserPermissions);

module.exports = router;
