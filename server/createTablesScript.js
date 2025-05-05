const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function createTables() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345',
      database: process.env.DB_NAME || 'cryptography_resources',
      multipleStatements: true
    });

    console.log('Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'config', 'courses_lectures_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL as a single statement
    console.log('Executing SQL...');
    await connection.query(sql);
    console.log('Tables created successfully');

    // Verify tables exist
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME || 'cryptography_resources'}'
    `);
    
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log(`- ${table.TABLE_NAME}`);
    });

  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

createTables();
