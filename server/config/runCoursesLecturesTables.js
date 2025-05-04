const fs = require('fs');
const path = require('path');
const { executeQuery } = require('./db');

async function runCoursesLecturesTables() {
  try {
    console.log('Reading SQL file...');
    const sqlPath = path.join(__dirname, 'courses_lectures_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Splitting SQL statements...');
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        try {
          await executeQuery(statement);
          console.log(`Statement ${i + 1} executed successfully`);
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('SQL execution completed');
  } catch (err) {
    console.error('Error running courses_lectures_tables.sql:', err);
  }
}

runCoursesLecturesTables();
