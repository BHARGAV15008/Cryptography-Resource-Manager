const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createEventsTable() {
  try {
    console.log('Creating events table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'events_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Create a direct connection to the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345',
      database: process.env.DB_NAME || 'cryptography_resources'
    });
    
    // Execute the SQL to create the events table
    await connection.query(sql);
    
    console.log('✅ Events table created successfully');
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('Error creating events table:', error.message);
    return false;
  }
}

// Export the function for use in other files
module.exports = { createEventsTable };

// If this script is run directly, execute the function
if (require.main === module) {
  createEventsTable()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
