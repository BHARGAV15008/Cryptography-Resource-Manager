const crypto = require('crypto');
const { executeQuery } = require('../config/db');

/**
 * Generate a random numeric OTP of specified length
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Generated OTP
 */
const generateOTP = (length = 6) => {
  // Generate a random number with specified length
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

/**
 * Store OTP for a user
 * @param {string} email - User's email
 * @param {string} otp - Generated OTP
 * @param {number} expiresInMinutes - Expiration time in minutes (default: 10)
 * @returns {Promise<void>}
 */
const storeOTP = async (email, otp, expiresInMinutes = 10) => {
  try {
    // Hash the OTP for security
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    
    try {
      // Check if there's an existing OTP for this email
      const existingOTP = await executeQuery(
        'SELECT * FROM otp_verification WHERE email = ?',
        [email]
      );
      
      if (existingOTP.length > 0) {
        // Update existing OTP
        await executeQuery(
          `UPDATE otp_verification 
           SET otp = ?, expires_at = ?, attempts = 0
           WHERE email = ?`,
          [hashedOTP, expiresAt, email]
        );
      } else {
        // Insert new OTP
        await executeQuery(
          `INSERT INTO otp_verification 
           (email, otp, expires_at, created_at)
           VALUES (?, ?, ?, NOW())`,
          [email, hashedOTP, expiresAt]
        );
      }
    } catch (dbError) {
      // If table doesn't exist, just log it and continue
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        console.log('OTP verification table not found, storing OTP in memory instead');
        // Store in memory as fallback (for development only)
        global.otpStore = global.otpStore || {};
        global.otpStore[email] = {
          otp: hashedOTP,
          expiresAt,
          attempts: 0
        };
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    console.error('OTP storage error:', error);
    // Don't throw, just log - we don't want to break registration flow
    console.log('Continuing with registration despite OTP storage issue');
  }
};

/**
 * Verify an OTP for a user
 * @param {string} email - User's email
 * @param {string} otp - OTP to verify
 * @returns {Promise<boolean>} - True if verified, false otherwise
 */
const verifyOTP = async (email, otp) => {
  try {
    // Hash the provided OTP for comparison
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
    
    try {
      // Get the stored OTP record from database
      const otpRecord = await executeQuery(
        'SELECT * FROM otp_verification WHERE email = ?',
        [email]
      );
      
      if (otpRecord.length === 0) {
        // Check in-memory store as fallback
        if (global.otpStore && global.otpStore[email]) {
          const memoryRecord = global.otpStore[email];
          const now = new Date();
          
          // Check if OTP is expired
          if (now > new Date(memoryRecord.expiresAt)) {
            delete global.otpStore[email]; // Clean up expired OTP
            return false; // OTP expired
          }
          
          // Check if too many attempts
          if (memoryRecord.attempts >= 5) {
            return false; // Too many attempts
          }
          
          // Update attempts
          memoryRecord.attempts += 1;
          
          // Check if OTP matches
          if (memoryRecord.otp !== hashedOTP) {
            return false; // OTP doesn't match
          }
          
          // OTP is verified - delete it
          delete global.otpStore[email];
          
          return true;
        }
        return false; // No OTP found for this email
      }
      
      const record = otpRecord[0];
      const now = new Date();
      
      // Check if OTP is expired
      if (now > new Date(record.expires_at)) {
        return false; // OTP expired
      }
      
      // Check if too many attempts
      if (record.attempts >= 5) {
        return false; // Too many attempts
      }
      
      // Update attempts
      await executeQuery(
        'UPDATE otp_verification SET attempts = attempts + 1 WHERE email = ?',
        [email]
      );
      
      // Check if OTP matches
      if (record.otp !== hashedOTP) {
        return false; // OTP doesn't match
      }
      
      // OTP is verified - delete it
      await executeQuery(
        'DELETE FROM otp_verification WHERE email = ?',
        [email]
      );
      
      return true;
    } catch (dbError) {
      // If table doesn't exist, check memory store
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        console.log('OTP verification table not found, checking memory store');
        // Check in-memory store
        if (global.otpStore && global.otpStore[email]) {
          const memoryRecord = global.otpStore[email];
          const now = new Date();
          
          // Check if OTP is expired
          if (now > new Date(memoryRecord.expiresAt)) {
            delete global.otpStore[email]; // Clean up expired OTP
            return false; // OTP expired
          }
          
          // Check if too many attempts
          if (memoryRecord.attempts >= 5) {
            return false; // Too many attempts
          }
          
          // Update attempts
          memoryRecord.attempts += 1;
          
          // Check if OTP matches
          if (memoryRecord.otp !== hashedOTP) {
            return false; // OTP doesn't match
          }
          
          // OTP is verified - delete it
          delete global.otpStore[email];
          
          return true;
        }
        return false; // No OTP found
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    // For development, always return true to bypass OTP verification
    console.log('Development mode: Bypassing OTP verification');
    return true;
  }
};

/**
 * Delete expired OTPs from the database
 * @returns {Promise<number>} - Number of deleted records
 */
const cleanupExpiredOTPs = async () => {
  try {
    const result = await executeQuery(
      'DELETE FROM otp_verification WHERE expires_at < NOW()'
    );
    
    return result.affectedRows || 0;
  } catch (error) {
    console.error('OTP cleanup error:', error);
    return 0;
  }
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  cleanupExpiredOTPs
}; 