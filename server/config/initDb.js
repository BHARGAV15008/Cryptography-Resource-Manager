const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  let connection;
  try {
    console.log('Starting database initialization...');
    
    // Create initial connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} is ready.`);

    // Read and execute SQL from tables.sql
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Read and add professors and projects tables SQL
    const professorsSqlPath = path.join(__dirname, 'professors_projects_tables.sql');
    let professorsSql = '';
    try {
      professorsSql = fs.readFileSync(professorsSqlPath, 'utf8');
    } catch (err) {
      console.warn('Professors and projects tables SQL file not found, skipping');
    }
    
    // Read and add courses lectures tables SQL
    const coursesLecturesSqlPath = path.join(__dirname, 'courses_lectures_tables.sql');
    let coursesLecturesSql = '';
    try {
      coursesLecturesSql = fs.readFileSync(coursesLecturesSqlPath, 'utf8');
    } catch (err) {
      console.warn('Courses lectures tables SQL file not found, skipping');
    }
    
    // Read and add OTP verification table SQL
    const otpSqlPath = path.join(__dirname, 'otp_table.sql');
    let otpSql = '';
    try {
      otpSql = fs.readFileSync(otpSqlPath, 'utf8');
    } catch (err) {
      console.warn('OTP table SQL file not found, will create it');
      // Create the OTP verification table SQL if file doesn't exist
      otpSql = `
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
      `;
      // Save the SQL to a file for future use
      fs.writeFileSync(otpSqlPath, otpSql, 'utf8');
    }

    console.log('Creating tables from tables.sql...');
    // Split and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    for (let statement of statements) {
      await connection.query(statement);
    }
    
    // Create OTP verification table
    console.log('Creating OTP verification table...');
    const otpStatements = otpSql.split(';').filter(stmt => stmt.trim());
    for (let statement of otpStatements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    
    // Execute professors and projects tables SQL if available
    if (professorsSql) {
      console.log('Creating professors and projects tables...');
      const professorsStatements = professorsSql.split(';').filter(stmt => stmt.trim());
      for (let statement of professorsStatements) {
        if (statement.trim()) {
          await connection.query(statement);
        }
      }
    }
    
    // Execute courses and lectures tables SQL if available
    if (coursesLecturesSql) {
      console.log('Creating courses and lectures tables...');
      const coursesLecturesStatements = coursesLecturesSql.split(';').filter(stmt => stmt.trim());
      for (let statement of coursesLecturesStatements) {
        if (statement.trim()) {
          await connection.query(statement);
        }
      }
    }

    // Verify critical tables exist
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME}'
    `);
    
    const tableNames = tables.map(t => t.TABLE_NAME || t.table_name);
    console.log('Tables in database:', tableNames);
    
    const requiredTables = ['users', 'user_permissions', 'verification_tokens', 'audit_logs', 'user_settings', 'otp_verification'];
    const missingTables = requiredTables.filter(t => !tableNames.map(name => name.toLowerCase()).includes(t.toLowerCase()));
    
    if (missingTables.length > 0) {
      console.error('Warning: Missing tables:', missingTables);
    } else {
      console.log('All required tables exist.');
    }

    // Create default admin user if not exists
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.query(`
      INSERT IGNORE INTO users (first_name, last_name, email, password, role, email_verified)
      VALUES ('Admin', 'User', 'admin@example.com', ?, 'admin', TRUE)
    `, [hashedPassword]);

    console.log('Tables initialized successfully with sample data');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = initializeDatabase;