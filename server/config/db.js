const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

const initializeDatabase = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000; // 3 seconds
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // First try to create database if it doesn't exist
      const tempPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000 // 10 seconds timeout
      });
      
      await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
      await tempPool.end();

      // Create the main connection pool
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        multipleStatements: true,
        connectTimeout: 10000 // 10 seconds timeout
      });

      // Test connection
      const connection = await pool.getConnection();
      console.log('Database connection established successfully');
      connection.release();
      return pool;
    } catch (error) {
      retries++;
      console.error(`Database connection attempt ${retries}/${MAX_RETRIES} failed:`, error.message);
      
      if (retries >= MAX_RETRIES) {
        console.error('Maximum connection retries reached. Please check your database credentials and configuration.');
        console.error('Error details:', error);
        console.log('Hint: Verify that your MySQL server is running and that the credentials in .env file are correct.');
        process.exit(1);
      }
      
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

// Execute a database query
const executeQuery = async (sql, params = []) => {
  try {
    // Handle transactions separately
    if (sql.trim().toUpperCase() === 'START TRANSACTION' || 
        sql.trim().toUpperCase() === 'COMMIT' || 
        sql.trim().toUpperCase() === 'ROLLBACK') {
      const connection = await pool.getConnection();
      try {
        await connection.query(sql);
        connection.release();
        return { affectedRows: 0 };
      } catch (err) {
        connection.release();
        throw err;
      }
    }

    // For normal queries
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Query execution error:', error.message);
    throw error;
  }
};

// Begin a transaction and get a connection
const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

// Commit a transaction
const commitTransaction = async (connection) => {
  await connection.commit();
  connection.release();
};

// Rollback a transaction
const rollbackTransaction = async (connection) => {
  await connection.rollback();
  connection.release();
};

// Execute a query within a transaction
const executeTransactionQuery = async (connection, sql, params = []) => {
  const [result] = await connection.execute(sql, params);
  return result;
};

// Check if a table exists
const checkTable = async (tableName) => {
  try {
    const [rows] = await pool.query(
      'SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [process.env.DB_NAME, tableName]
    );
    return rows.length > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error.message);
    return false;
  }
};

// Check if a column exists in a table
const checkColumn = async (tableName, columnName) => {
  try {
    const [columns] = await pool.query(
      'SHOW COLUMNS FROM ?? LIKE ?', 
      [tableName, columnName]
    );
    return columns.length > 0;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error.message);
    return false;
  }
};

// Function to ensure email_verified column exists in users table
const ensureEmailVerifiedExists = async () => {
  const hasColumn = await checkColumn('users', 'email_verified');
  if (!hasColumn) {
    await executeQuery('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE');
    console.log('Added email_verified column to users table');
  }
  return true;
};

module.exports = {
  connectDB: initializeDatabase,
  getPool: () => pool,
  pool: () => pool, 
  getConnection: async () => await pool.getConnection(), 
  executeQuery,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  executeTransactionQuery,
  checkTable,
  checkColumn,
  ensureEmailVerifiedExists
};
