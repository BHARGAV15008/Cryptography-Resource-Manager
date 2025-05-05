-- OTP verification table for email verification and password reset
CREATE TABLE IF NOT EXISTS otp_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(255) NOT NULL,
  attempts INT DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email)
);
