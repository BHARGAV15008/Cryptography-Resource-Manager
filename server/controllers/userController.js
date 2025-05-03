const { executeQuery, beginTransaction, commitTransaction, rollbackTransaction } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { sendOTPEmail } = require('../utils/emailService');
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otpService');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  try {
    console.log('Fetching users from database...');
    const { executeQuery } = require('../config/db');
    
    // Fetch users with their permissions in a single query using JOIN
    const usersWithPermissions = await executeQuery(
      `SELECT u.id, u.first_name, u.last_name, u.name, u.email, u.role, u.email_verified, u.created_at,
       up.access_dashboard, up.manage_users, up.manage_contents, up.can_view_analytics
       FROM users u
       LEFT JOIN user_permissions up ON u.id = up.user_id
       ORDER BY u.id`,
      []
    );
    
    if (!usersWithPermissions || usersWithPermissions.length === 0) {
      console.log('No users found in database');
      return res.json([]);
    }
    
    // Format the users with their permissions
    const formattedUsers = usersWithPermissions.map(user => {
      return {
        id: user.id,
        name: user.name || `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        permissions: {
          canAccessDashboard: Boolean(user.access_dashboard),
          canManageUsers: Boolean(user.manage_users),
          canManageContent: Boolean(user.manage_contents),
          canViewAnalytics: Boolean(user.can_view_analytics)
        },
        emailVerified: Boolean(user.email_verified),
        createdAt: user.created_at
      };
    });
    
    console.log(`Successfully fetched ${formattedUsers.length} users from database`);
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user with permissions
    const userResults = await executeQuery(`
      SELECT u.*, 
             up.access_dashboard AS can_access_dashboard,
             up.manage_users AS can_manage_users,
             up.manage_contents AS can_manage_content,
             up.can_view_analytics
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      WHERE u.id = ?
    `, [userId]);

    if (userResults.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const user = userResults[0];

    // Format user data for response
    const userData = {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      permissions: {
        canAccessDashboard: !!user.can_access_dashboard,
        canManageUsers: !!user.can_manage_users,
        canManageContent: !!user.can_manage_content,
        canViewAnalytics: !!user.can_view_analytics
      },
      emailVerified: !!user.email_verified,
      createdAt: user.created_at
    };

    res.status(200).json(userData);
  } catch (error) {
    if (res.statusCode !== 404) res.status(500);
    throw new Error(error.message);
  }
});

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role, password } = req.body;
    
    // Validate inputs
    if (!name && !email && !role && !password) {
      res.status(400);
      throw new Error('No data provided for update');
    }

    // Check if user exists
    const userExists = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);
    if (userExists.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    // Begin transaction
    const connection = await beginTransaction();
    
    try {
      // Split name into first and last name
      let firstName, lastName;
      
      if (name) {
        const nameParts = name.trim().split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Build update query
      let updateFields = [];
      let updateValues = [];

      if (firstName) {
        updateFields.push('first_name = ?');
        updateValues.push(firstName);
      }

      if (lastName) {
        updateFields.push('last_name = ?');
        updateValues.push(lastName);
      }

      if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }

      if (role) {
        updateFields.push('role = ?');
        updateValues.push(role);
      }

      // If there are fields to update
      if (updateFields.length > 0) {
        updateValues.push(userId);
        await executeQuery(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      // Update password if provided
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await executeQuery(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, userId]
        );
      }

      // Commit the transaction
      await commitTransaction(connection);

      res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      // Rollback on error
      await rollbackTransaction(connection);
      throw error;
    }
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message);
  }
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Attempting to delete user with ID: ${userId}`);

    try {
      // Check if user exists
      const userExists = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);
      
      if (userExists.length === 0) {
        console.log(`User with ID ${userId} not found in database, using mock deletion`);
        // For development, return success even if user doesn't exist
        if (process.env.NODE_ENV === 'development') {
          return res.json({ 
            success: true, 
            message: 'User deleted successfully (mock deletion)',
            mock: true
          });
        } else {
          res.status(404);
          throw new Error('User not found');
        }
      }

      // Delete user
      await executeQuery('DELETE FROM users WHERE id = ?', [userId]);
      console.log(`User with ID ${userId} deleted successfully from database`);

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (dbError) {
      console.error('Database error during user deletion:', dbError);
      
      // For development, return success even if there's a database error
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Returning mock success for deletion');
        return res.json({ 
          success: true, 
          message: 'User deleted successfully (mock deletion)',
          mock: true,
          error: dbError.message
        });
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message);
  }
});

// @desc    Get user audit logs
// @route   GET /api/users/:id/audit-logs
// @access  Private/Admin
const getUserAuditLogs = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const userExists = await executeQuery('SELECT id FROM users WHERE id = ?', [userId]);
    if (userExists.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    // Get audit logs for the user
    const auditLogs = await executeQuery(`
      SELECT * FROM audit_logs 
      WHERE entity_type = 'USER' AND entity_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    res.json(auditLogs);
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message);
  }
});

// @desc    Update current user profile
// @route   PUT /api/users/profile/me
// @access  Private
const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!firstName && !lastName && !email) {
      res.status(400);
      throw new Error('At least one field is required for update');
    }

    // Check if user exists
    const userExists = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);
    if (userExists.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    // Build update query
    let updateFields = [];
    let updateValues = [];

    if (firstName) {
      updateFields.push('first_name = ?');
      updateValues.push(firstName);
    }

    if (lastName) {
      updateFields.push('last_name = ?');
      updateValues.push(lastName);
    }

    if (email && email !== userExists[0].email) {
      // Check if new email is already in use
      const emailExists = await executeQuery('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (emailExists.length > 0) {
        res.status(400);
        throw new Error('Email already in use');
      }

      updateFields.push('email = ?');
      updateValues.push(email);
      
      // Reset email verification if email changes
      updateFields.push('email_verified = ?');
      updateValues.push(false);
    }

    // If there are fields to update
    if (updateFields.length > 0) {
      updateValues.push(userId);
      
      // Execute update
      await executeQuery(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      res.json({ 
        success: true, 
        message: 'Profile updated successfully',
        emailChanged: email && email !== userExists[0].email
      });
    } else {
      res.json({ success: true, message: 'No changes made' });
    }
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message);
  }
});

// @desc    Update user permissions
// @route   PUT /api/users/:id/permissions
// @access  Private/Admin
const updateUserPermissions = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    const permissions = req.body.permissions;

    if (!permissions) {
      res.status(400);
      throw new Error('Permissions data is required');
    }

    // Check if user exists
    const userExists = await executeQuery('SELECT id FROM users WHERE id = ?', [userId]);
    if (userExists.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check if permissions record exists
    const permissionsExist = await executeQuery(
      'SELECT * FROM user_permissions WHERE user_id = ?',
      [userId]
    );

    if (permissionsExist.length > 0) {
      // Update existing permissions
      await executeQuery(
        `UPDATE user_permissions SET
         access_dashboard = ?,
         manage_users = ?,
         manage_contents = ?,
         can_view_analytics = ?,
         updated_at = NOW()
         WHERE user_id = ?`,
        [
          permissions.canAccessDashboard ? 1 : 0,
          permissions.canManageUsers ? 1 : 0,
          permissions.canManageContent ? 1 : 0,
          permissions.canViewAnalytics ? 1 : 0,
          userId
        ]
      );
    } else {
      // Create new permissions record
      await executeQuery(
        `INSERT INTO user_permissions (
          user_id, access_dashboard, manage_users, manage_contents, can_view_analytics, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          permissions.canAccessDashboard ? 1 : 0,
          permissions.canManageUsers ? 1 : 0,
          permissions.canManageContent ? 1 : 0,
          permissions.canViewAnalytics ? 1 : 0
        ]
      );
    }

    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message);
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, surname, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  try {
    // Check if user already exists
    try {
      const existingUsers = await executeQuery(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        console.log(`User with email ${email} already exists in database`);
        // For development, return mock success
        if (process.env.NODE_ENV === 'development') {
          // Generate a fake user ID
          const userId = Math.floor(Math.random() * 10000) + 1000;
          console.log(`Development mode: Returning mock success for registration with ID: ${userId}`);
          return res.status(201).json({
            message: 'User registered successfully (mock registration).',
            userId,
            email,
            mock: true
          });
        } else {
          res.status(400);
          throw new Error('User already exists');
        }
      }
    } catch (dbError) {
      console.error('Database error during user check:', dbError);
      // For development, continue with mock registration
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Proceeding with mock registration despite database error');
      } else {
        throw dbError;
      }
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
        `INSERT INTO users (first_name, last_name, email, password, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [name, surname || '', email, hashedPassword]
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
        `INSERT INTO user_permissions (user_id, created_at) 
         VALUES (?, NOW())`,
        [userId]
      );

      // Generate OTP
      const otp = generateOTP(6);
      
      // Store OTP
      await storeOTP(email, otp);

      // Log user creation in audit
      await executeQuery(
        `INSERT INTO audit_logs (
          user_id, action_type, entity_type, entity_id, new_value, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          'CREATE',
          'USER',
          userId,
          JSON.stringify({ name, email, role: 'user' })
        ]
      );

      // Commit transaction
      if (connection) {
        await commitTransaction(connection);
      }

      // Send OTP email
      await sendOTPEmail(email, otp, name);

      res.status(201).json({
        message: 'User registered successfully. Please verify your email with the OTP sent.',
        userId,
        email
      });
    } catch (transactionError) {
      // Rollback on error
      if (connection) {
        await rollbackTransaction(connection);
      }
      
      // In development mode, provide mock success
      if (process.env.NODE_ENV === 'development') {
        console.log('Transaction error during registration, using mock registration:', transactionError.message);
        const mockUserId = Math.floor(Math.random() * 10000) + 1000;
        return res.status(201).json({
          message: 'User registered successfully (mock registration).',
          userId: mockUserId,
          email,
          mock: true,
          error: transactionError.message
        });
      } else {
        throw transactionError;
      }
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    
    // For development mode, provide mock success
    if (process.env.NODE_ENV === 'development') {
      console.log('Outer error handler: Using mock registration');
      const mockUserId = Math.floor(Math.random() * 10000) + 1000;
      return res.status(201).json({
        message: 'User registered successfully (mock registration).',
        userId: mockUserId,
        email,
        mock: true,
        error: error.message
      });
    }
    
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'Registration failed');
  }
});

// @desc    Verify OTP and activate user account
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTPAndActivateAccount = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Please provide email and OTP');
  }

  try {
    // Verify OTP
    const isValid = await verifyOTP(email, otp);

    if (!isValid) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    // Get user
    const users = await executeQuery(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const user = users[0];

    // If user is already verified
    if (user.email_verified) {
      return res.json({
        message: 'Email already verified',
        token: generateToken(user.id)
      });
    }

    // Update user to verified
    await executeQuery(
      'UPDATE users SET email_verified = TRUE WHERE id = ?',
      [user.id]
    );

    // Log verification in audit
    await executeQuery(
      `INSERT INTO audit_logs (
        user_id, action_type, entity_type, entity_id, old_value, new_value, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id,
        'UPDATE',
        'USER',
        user.id,
        JSON.stringify({ email_verified: false }),
        JSON.stringify({ email_verified: true })
      ]
    );

    // Get user permissions
    const permissions = await executeQuery(
      'SELECT * FROM user_permissions WHERE user_id = ?',
      [user.id]
    );

    // Get user settings
    const settings = await executeQuery(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id);

    // Return user data and token
    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      permissions: permissions[0] || {},
      settings: settings[0] || {},
      token
    });
  } catch (error) {
    console.error('OTP verification error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'OTP verification failed');
  }
});

// @desc    Resend OTP for email verification
// @route   POST /api/users/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide email');
  }

  try {
    // Check if user exists
    const users = await executeQuery(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const user = users[0];

    // If user is already verified
    if (user.email_verified) {
      return res.status(400).json({
        message: 'Email is already verified'
      });
    }

    // Generate OTP
    const otp = generateOTP(6);
    
    // Store OTP
    await storeOTP(email, otp);

    // Send OTP email
    await sendOTPEmail(email, otp, user.name);

    res.json({
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'Failed to resend OTP');
  }
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // Get user
    const users = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      await logFailedLogin(null, email, ipAddress, userAgent, 'Invalid email');
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Check if email is verified
    if (!user.email_verified) {
      await logFailedLogin(user.id, email, ipAddress, userAgent, 'Email not verified');
      res.status(401);
      throw new Error('Please verify your email before logging in');
    }

    // Check if account is suspended
    if (user.account_status === 'suspended') {
      await logFailedLogin(user.id, email, ipAddress, userAgent, 'Account suspended');
      res.status(401);
      throw new Error('Your account has been suspended. Please contact an administrator.');
    }

    // Check if account is inactive
    if (user.account_status === 'inactive') {
      await logFailedLogin(user.id, email, ipAddress, userAgent, 'Account inactive');
      res.status(401);
      throw new Error('Your account is inactive. Please contact an administrator.');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment login attempts
      await executeQuery(
        'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?',
        [user.id]
      );

      // If too many failed attempts, suspend account
      if (user.login_attempts >= 4) { // This makes 5 total with the current one
        await executeQuery(
          'UPDATE users SET account_status = ? WHERE id = ?',
          ['suspended', user.id]
        );
      }

      await logFailedLogin(user.id, email, ipAddress, userAgent, 'Invalid password');
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Reset login attempts
    await executeQuery(
      'UPDATE users SET login_attempts = 0 WHERE id = ?',
      [user.id]
    );

    // Log successful login
    await executeQuery(
      `INSERT INTO audit_logs (
        user_id, action_type, entity_type, entity_id, created_at
      ) VALUES (?, ?, ?, ?, NOW())`,
      [
        user.id,
        'LOGIN',
        'USER',
        user.id
      ]
    );

    // Get user permissions
    const permissions = await executeQuery(
      'SELECT * FROM user_permissions WHERE user_id = ?',
      [user.id]
    );

    // Get user settings
    const settings = await executeQuery(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id);

    // Return user data
    res.json({
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      institution: user.institution,
      position: user.position,
      profile_image: user.profile_image,
      bio: user.bio,
      email_verified: user.email_verified,
      // last_login field removed as it doesn't exist in the schema
      permissions: permissions[0] || {},
      settings: settings[0] || {},
      token
    });
  } catch (error) {
    console.error('Login error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'Login failed');
  }
});

// Helper to log failed login attempts
const logFailedLogin = async (userId, email, ipAddress, userAgent, reason) => {
  try {
    await executeQuery(
      `INSERT INTO audit_logs (
        user_id, action_type, entity_type, entity_id, old_value, new_value, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId || null,
        'LOGIN',
        'USER',
        userId || 0,
        JSON.stringify({ success: false, email, reason }),
        null
      ]
    );
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  try {
    // Get user
    const users = await executeQuery(
      `SELECT id, name, surname, email, role, institution, position, 
       profile_image, bio, email_verified, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    // Get user permissions
    const permissions = await executeQuery(
      'SELECT * FROM user_permissions WHERE user_id = ?',
      [req.user.id]
    );

    // Get user settings
    const settings = await executeQuery(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    // Return user data
    res.json({
      ...users[0],
      permissions: permissions[0] || {},
      settings: settings[0] || {}
    });
  } catch (error) {
    console.error('Get user profile error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'Failed to get user profile');
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = {
  registerUser,
  loginUser,
  verifyOTPAndActivateAccount,
  resendOTP,
  getUserProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserAuditLogs,
  updateCurrentUserProfile,
  updateUserPermissions
};